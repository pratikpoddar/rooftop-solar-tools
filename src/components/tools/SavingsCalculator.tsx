"use client";

import { useMemo, useState } from "react";
import {
  BANKS,
  DEFAULT_ASSUMPTIONS,
  computeBill,
  defaultLoanAmount,
  emi as computeEmi,
  estimateGeneration,
  estimateSavings,
  formatIndianNumber,
  getNetMeteringRule,
  kwLabel,
  netCost as computeNetCost,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  unitsFromBill,
  years as formatYears,
} from "./engine";
import { CityField, DiscomField, StateField, ToolFooter, ToolFrame, useLocation } from "./shared";
import type { InitialLocation } from "./shared";
import { CompletionPing } from "./CompletionPing";
import { STANDARD_SIZES } from "./engine";
import { Details, NumberInput, PercentSlider, SegmentedControl, SizeSlider } from "../controls";
import { Card, Callout, HeroStat, LineItems, NoteList, SectionHeading, Stat, StatGrid, VerifiedStamp } from "../ui";
import { CumulativeSavingsChart, EmiVsSavingChart, MonthlyGenerationChart } from "../charts";
import { ShareCard } from "../ShareCard";
import { SocietyCta } from "../SocietyCta";
import { SubsidyUrgency } from "../SubsidyUrgency";
import { en, t } from "@/i18n/en";
import { makeStartTracker, track } from "@/lib/analytics";

const startTracking = makeStartTracker("savings");

export interface SavingsInitial extends InitialLocation {
  kw?: number;
  monthlyUnits?: number;
  monthlyBill?: number;
}

/** T3 — the viral card and the "is solar worth it" answer. */
export function SavingsCalculator({
  initial = {},
  sourcePage,
}: {
  initial?: SavingsInitial;
  sourcePage: string;
}) {
  const loc = useLocation(initial);
  const [kw, setKw] = useState(initial.kw ?? 3);
  const [inputMode, setInputMode] = useState<"bill" | "units">(initial.monthlyUnits ? "units" : "bill");
  const [bill, setBill] = useState<number | "">(initial.monthlyBill ?? 2500);
  const [units, setUnits] = useState<number | "">(initial.monthlyUnits ?? 300);
  const [selfConsumption, setSelfConsumption] = useState(Math.round(DEFAULT_ASSUMPTIONS.selfConsumptionShare * 100));
  const [escalation, setEscalation] = useState(DEFAULT_ASSUMPTIONS.tariffEscalationPct);
  const [financing, setFinancing] = useState<"cash" | "loan">("cash");

  const monthlyUnits = useMemo(() => {
    if (inputMode === "units") return units === "" ? 0 : units;
    if (!loc.discom || bill === "") return 0;
    return unitsFromBill(bill, loc.discom);
  }, [inputMode, units, bill, loc.discom]);

  const subsidy = subsidyBreakdown({ kw, stateSlug: loc.stateSlug });
  const net = computeNetCost(kw, subsidy.total, loc.stateSlug);

  const savings = useMemo(
    () =>
      estimateSavings({
        kw,
        stateSlug: loc.stateSlug,
        citySlug: loc.citySlug,
        discomId: loc.discomId,
        monthlyUnits,
        netCost: net,
        assumptions: { selfConsumptionShare: selfConsumption / 100, tariffEscalationPct: escalation },
      }),
    [kw, loc.stateSlug, loc.citySlug, loc.discomId, monthlyUnits, net, selfConsumption, escalation],
  );

  const generation = estimateGeneration({ kw, citySlug: loc.citySlug, stateSlug: loc.stateSlug });
  const currentBill = loc.discom ? computeBill(monthlyUnits, loc.discom).total : 0;
  const rule = getNetMeteringRule(loc.stateSlug);
  const cheapest = BANKS[0];
  const loanAmount = defaultLoanAmount(net);
  const emi = computeEmi(loanAmount, cheapest.ratePct, 10);

  function onChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      startTracking({ state: loc.stateSlug, city: loc.citySlug });
      setter(v);
    };
  }

  return (
    <div className="space-y-6">
      <ToolFrame
        title={en.savings.title}
        lede={en.savings.lede}
        inputs={
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <StateField loc={{ ...loc, setStateSlug: onChange(loc.setStateSlug) }} />
              <CityField loc={{ ...loc, setCity: onChange(loc.setCity) }} />
            </div>
            <DiscomField loc={{ ...loc, setDiscomId: onChange(loc.setDiscomId) }} />
            <SegmentedControl
              label="What do you know?"
              value={inputMode}
              onChange={onChange(setInputMode)}
              options={[
                { value: "bill", label: "My bill amount" },
                { value: "units", label: "My units" },
              ]}
            />
            {inputMode === "bill" ? (
              <NumberInput label={en.common.monthlyBill} prefix="Rs" value={bill} onChange={onChange(setBill)} step={100} />
            ) : (
              <NumberInput label={en.common.monthlyUnits} suffix="kWh" value={units} onChange={onChange(setUnits)} step={10} />
            )}
            <SizeSlider label={`${en.common.systemSize}: ${kwLabel(kw)}`} value={kw} onChange={onChange(setKw)} sizes={STANDARD_SIZES} />
            <SegmentedControl
              label="How are you paying"
              value={financing}
              onChange={onChange(setFinancing)}
              options={[
                { value: "cash", label: "Cash" },
                { value: "loan", label: "Loan" },
              ]}
            />
          </>
        }
        results={
          <Card tone="accent" className="space-y-5 p-4 sm:p-5">
            <HeroStat
              label={en.savings.lifetime}
              value={rupeesShort(savings.lifetimeSaving)}
              sub={`from a ${kwLabel(kw)} system in ${loc.placeLabel}`}
              tone="good"
            />

            {/*
              A 25-year total is dominated by the tariff-escalation assumption, so
              we say so next to the number rather than burying it in a disclosure.
            */}
            <p className="-mt-2 text-center text-xs text-[var(--fg-subtle)]">
              Assumes electricity tariffs rise {escalation}% a year, which compounds to about{" "}
              {(Math.pow(1 + escalation / 100, DEFAULT_ASSUMPTIONS.horizonYears) || 1).toFixed(1)}x by year{" "}
              {DEFAULT_ASSUMPTIONS.horizonYears}. Undiscounted rupees.{" "}
              <span className="whitespace-nowrap">Change it in the assumptions below.</span>
            </p>

            <StatGrid cols={3}>
              <Stat
                label={en.savings.year1Monthly}
                value={`${rupees(savings.year1MonthlySaving)}`}
                /*
                  In net-billing states the export half can exceed a small bill,
                  so we name the two components instead of a bare total that
                  looks like it beats the whole bill.
                */
                sub={
                  savings.year1ExportIncome > 0
                    ? `${en.common.perMonth} — ${rupees(Math.round(savings.year1BillSaving / 12))} off the bill, ${rupees(Math.round(savings.year1ExportIncome / 12))} for exports`
                    : en.common.perMonth
                }
                emphasis
              />
              <Stat label={en.savings.payback} value={formatYears(savings.paybackYears)} sub={`on ${rupeesShort(net)} net cost`} emphasis />
              <Stat label="Your bill today" value={rupees(currentBill)} sub={`${formatIndianNumber(monthlyUnits)} units`} />
            </StatGrid>

            <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--bg)] p-3">
              <SectionHeading as="h3" className="mb-2">
                {en.savings.chartTitle}
              </SectionHeading>
              <CumulativeSavingsChart years={savings.years} netCost={net} paybackYears={savings.paybackYears} />
            </div>

            {financing === "loan" ? (
              <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--bg)] p-3">
                <SectionHeading as="h3" className="mb-2">
                  {en.savings.emiVsSaving}
                </SectionHeading>
                <EmiVsSavingChart emi={emi} saving={savings.year1MonthlySaving} />
                <p className="mt-2 text-xs text-[var(--fg-subtle)]">
                  {rupeesShort(loanAmount)} over 10 years at {cheapest.ratePct}% with {cheapest.name}.{" "}
                  <a href="/tools/loan-emi" className="font-medium text-[var(--accent)] underline underline-offset-2">
                    Compare banks →
                  </a>
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--bg)] p-3">
              <SectionHeading as="h3" className="mb-2">
                {en.savings.monthlyTitle}
              </SectionHeading>
              <MonthlyGenerationChart monthlyKwh={generation.monthlyKwh} />
            </div>

            {savings.notes.length ? (
              <div className="border-t border-[var(--accent-line)] pt-4">
                <NoteList notes={savings.notes} />
              </div>
            ) : null}

            {rule?.gotchas.length ? (
              <Callout tone="warn" title={`${loc.state?.name} net-metering rules that change this number`}>
                <NoteList notes={rule.gotchas} />
                <VerifiedStamp date={rule.lastVerified} confidence={rule.confidence} className="mt-2" />
              </Callout>
            ) : null}

            <Details summary={en.common.showAssumptions}>
              <div className="space-y-4" onClick={() => track("assumptions_opened", { tool: "savings" })}>
                <PercentSlider
                  label={en.savings.selfConsumption}
                  hint="Units you use as they are generated are worth your full retail rate. Exported units are worth less — how much less depends on your state."
                  value={selfConsumption}
                  onChange={setSelfConsumption}
                  min={30}
                  max={100}
                />
                <PercentSlider
                  label="Tariff increase per year"
                  hint="The single most sensitive assumption in a 25-year number. The default of 5% a year compounds to roughly 3.4x by year 25."
                  value={escalation}
                  onChange={setEscalation}
                  min={0}
                  max={10}
                  step={1}
                />
                <LineItems
                  items={[
                    { label: "Generation", value: `${formatIndianNumber(generation.kwhPerKwpYear)} kWh per kWp per year`, note: loc.city ? `${loc.city.name} city figure` : "State average" },
                    { label: "Panel degradation", value: `${DEFAULT_ASSUMPTIONS.degradationPct}% per year` },
                    { label: "Maintenance", value: `${rupees(DEFAULT_ASSUMPTIONS.omCostYear1)} in year 1`, note: `rising ${DEFAULT_ASSUMPTIONS.omEscalationPct}% a year` },
                    { label: "Inverter replacement", value: rupees(DEFAULT_ASSUMPTIONS.inverterReplacementCost), note: `assumed in year ${DEFAULT_ASSUMPTIONS.inverterReplacementYear}` },
                    { label: "Export rate", value: `Rs ${savings.exportRatePerKwh}/unit`, note: savings.mechanism === "net-billing" ? "net billing — exports bought at APPC" : "net metering — exports netted against your bill" },
                    { label: "Horizon", value: `${DEFAULT_ASSUMPTIONS.horizonYears} years` },
                  ]}
                />
              </div>
            </Details>
          </Card>
        }
      />

      <SubsidyUrgency stateSlug={loc.stateSlug} amount={subsidy.total} />

      <SocietyCta
        kw={kw}
        place={loc.placeLabel}
        monthlySaving={savings.year1MonthlySaving}
        session={{ t: "savings", s: loc.stateSlug, c: loc.citySlug, d: loc.discomId, k: kw, u: monthlyUnits }}
        tool="savings"
      />

      <ToolFooter
        tool="savings"
        stateSlug={loc.stateSlug}
        citySlug={loc.citySlug}
        kw={kw}
        monthlyBill={currentBill}
        sourcePage={sourcePage}
        share={
          <ShareCard
            tool="savings"
            kind="savings"
            value={savings.lifetimeSaving}
            value2={subsidy.total}
            place={loc.placeLabel}
            kw={kw}
            payback={savings.paybackYears}
            monthly={savings.year1MonthlySaving}
            text={
              Number.isFinite(savings.paybackYears)
                ? t(en.savings.card, {
                    kw,
                    place: loc.placeLabel,
                    payback: formatYears(savings.paybackYears),
                    monthly: rupees(savings.year1MonthlySaving),
                  })
                : t(en.savings.cardNoPayback, {
                    kw,
                    place: loc.placeLabel,
                    monthly: rupees(savings.year1MonthlySaving),
                  })
            }
            session={{ t: "savings", s: loc.stateSlug, c: loc.citySlug, d: loc.discomId, k: kw, u: monthlyUnits }}
          />
        }
      />
      <CompletionPing tool="savings" state={loc.stateSlug} city={loc.citySlug} kw={kw} />
    </div>
  );
}
