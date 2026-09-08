import type { SavingsAssumptions, SavingsResult, SavingsYear } from "./types";
import { estimateGeneration } from "./generation";
import { computeBill, resolveDiscom, DEFAULT_SANCTIONED_LOAD_KW } from "./tariffs";
import { exportRatePerKwh, getNetMeteringRule, surplusLapses } from "./net-metering";

/** Spec §T3 defaults. Every one of these is surfaced in the UI, not hidden. */
/** Stand-in per-unit value when a state has no tariff table yet. */
const FALLBACK_RATE_PER_KWH = 6;

export const DEFAULT_ASSUMPTIONS: SavingsAssumptions = {
  selfConsumptionShare: 0.7,
  tariffEscalationPct: 5,
  degradationPct: 0.7,
  omCostYear1: 3000,
  omEscalationPct: 5,
  inverterReplacementCost: 25000,
  inverterReplacementYear: 13,
  horizonYears: 25,
};

export interface SavingsInput {
  kw: number;
  stateSlug: string;
  citySlug?: string;
  discomId?: string;
  /** Baseline consumption before solar. */
  monthlyUnits: number;
  /** Cost after subsidy — the number payback is measured against. */
  netCost: number;
  sanctionedLoadKw?: number;
  assumptions?: Partial<SavingsAssumptions>;
}

/**
 * T3: 25-year savings and payback.
 *
 * The valuation has to respect what a bill can actually do:
 *
 *  - Self-consumed units are priced by recomputing the bill with those units
 *    removed, so they erase the most expensive slabs first.
 *  - Under NET METERING, exported units net 1:1 — but only against units the
 *    household still buys. Those units sit in the *lower* slabs once
 *    self-consumption has eaten the top ones, so they are priced by removing
 *    them from the bill too, not at the pre-solar marginal rate. Anything beyond
 *    the household's own annual consumption is true surplus, settled at APPC or
 *    lapsed depending on the state.
 *  - Under NET BILLING (UP, Tamil Nadu), nothing nets: every exported unit is
 *    bought at APPC.
 *
 * The consequence is an invariant worth stating: bill savings can never exceed
 * the bill, less the fixed charges that survive regardless of generation.
 */
export function estimateSavings(input: SavingsInput): SavingsResult {
  const {
    kw,
    stateSlug,
    citySlug,
    discomId,
    monthlyUnits,
    netCost,
    sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW,
  } = input;
  const a: SavingsAssumptions = { ...DEFAULT_ASSUMPTIONS, ...input.assumptions };

  const discom = resolveDiscom({ discomId, stateSlug });
  const rule = getNetMeteringRule(stateSlug);
  const notes: string[] = [];

  const baselineAnnualUnits = monthlyUnits * 12;
  const year1Bill = discom ? computeBill(monthlyUnits, discom, sanctionedLoadKw) : null;
  const marginalRate = year1Bill?.marginalRatePerUnit ?? 0;
  const { rate: exportRate, basis, bankingCharge } = exportRatePerKwh(stateSlug, marginalRate, { discomId });

  if (basis === "appc") {
    notes.push(
      `${rule?.mechanism === "net-billing" ? "This state runs net billing" : "Exports are bought, not credited"}: exported units are paid at about Rs ${exportRate}/unit instead of being netted 1:1 against your tariff.`,
    );
  }
  if (bankingCharge > 0) {
    notes.push(`A banking charge of Rs ${bankingCharge}/unit is deducted from every exported unit.`);
  }
  if (surplusLapses(stateSlug)) {
    notes.push("Surplus beyond your own annual consumption lapses at financial year end in this state, so it is valued at zero — do not oversize.");
  }
  if (!discom) {
    notes.push("No tariff table for this state yet — savings shown are indicative.");
  }

  const firstYearGen = estimateGeneration({ kw, citySlug, stateSlug, year: 1, degradationPct: a.degradationPct }).annualKwh;
  if (baselineAnnualUnits > 0 && firstYearGen > baselineAnnualUnits * 1.15) {
    notes.push(
      `This system generates more than you consume (${Math.round(firstYearGen).toLocaleString("en-IN")} units a year against ${baselineAnnualUnits.toLocaleString("en-IN")}). Surplus earns far less than the units you offset, so a smaller system usually pays back faster.`,
    );
  }

  const isNetMetering = (rule?.mechanism ?? "net-metering") === "net-metering";
  const lapses = surplusLapses(stateSlug);
  const appcRate = discom?.appcRatePerKwh ?? 3.2;

  const years: SavingsYear[] = [];
  let cumulative = 0;

  for (let y = 1; y <= a.horizonYears; y++) {
    const gen = estimateGeneration({ kw, citySlug, stateSlug, year: y, degradationPct: a.degradationPct }).annualKwh;
    const escalation = Math.pow(1 + a.tariffEscalationPct / 100, y - 1);

    const selfConsumedKwh = Math.min(gen * a.selfConsumptionShare, baselineAnnualUnits);
    const exportedKwh = Math.max(0, gen - selfConsumedKwh);

    // Units that actually come off the bill: self-consumption, plus — under net
    // metering only — exports netted against the grid draw that remains.
    const nettableKwh = Math.max(0, baselineAnnualUnits - selfConsumedKwh);
    const nettedKwh = isNetMetering ? Math.min(exportedKwh, nettableKwh) : 0;
    const surplusKwh = exportedKwh - nettedKwh;
    const billOffsetKwh = selfConsumedKwh + nettedKwh;

    const billSaving = discom
      ? (computeBill(monthlyUnits, discom, sanctionedLoadKw).total -
          computeBill(Math.max(0, monthlyUnits - billOffsetKwh / 12), discom, sanctionedLoadKw).total) *
        12 *
        escalation
      : billOffsetKwh * FALLBACK_RATE_PER_KWH * escalation;

    // Banking charges are levied on units banked and drawn back, not on self-consumption.
    const bankingCost = nettedKwh * bankingCharge * escalation;

    // What is left over after the household's own annual consumption.
    const surplusCredit = isNetMetering
      ? (lapses ? 0 : surplusKwh * appcRate * escalation)
      : exportedKwh * exportRate * escalation;

    const selfConsumptionSaving = billSaving - bankingCost;
    const exportCredit = surplusCredit;

    const omCost = a.omCostYear1 * Math.pow(1 + a.omEscalationPct / 100, y - 1);
    const inverterCost = y === a.inverterReplacementYear ? a.inverterReplacementCost : 0;
    const netSaving = selfConsumptionSaving + exportCredit - omCost - inverterCost;
    cumulative += netSaving;

    years.push({
      year: y,
      generationKwh: Math.round(gen),
      selfConsumedKwh: Math.round(selfConsumedKwh),
      exportedKwh: Math.round(exportedKwh),
      selfConsumptionSaving: Math.round(selfConsumptionSaving),
      exportCredit: Math.round(exportCredit),
      omCost: Math.round(omCost),
      inverterCost,
      netSaving: Math.round(netSaving),
      cumulative: Math.round(cumulative),
    });
  }

  const y1 = years[0];
  const year1Benefit = y1.selfConsumptionSaving + y1.exportCredit;
  const paybackYears = y1.netSaving > 0 ? Math.round((netCost / y1.netSaving) * 10) / 10 : Infinity;

  return {
    year1MonthlySaving: Math.round(year1Benefit / 12),
    year1AnnualSaving: Math.round(year1Benefit),
    year1BillSaving: y1.selfConsumptionSaving,
    year1ExportIncome: y1.exportCredit,
    year1NetSaving: y1.netSaving,
    paybackYears,
    lifetimeSaving: Math.round(cumulative),
    years,
    assumptions: a,
    mechanism: rule?.mechanism ?? "net-metering",
    exportRatePerKwh: exportRate,
    notes,
  };
}
