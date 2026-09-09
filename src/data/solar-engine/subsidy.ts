import type { ConsumerType, StateTopUp, SubsidyBreakdown } from "./types";
import { NO_TOP_UP_STATES, STATE_TOP_UPS, noTopUpRecord } from "./tables/state-top-ups";

/** GHS/RWA common-facility rate, Rs per kW (spec §2.1). */
export const GHS_RATE_PER_KW = 18000;
export const GHS_MAX_KW = 500;
/** Residential CFA cap for any system above 3 kW (spec §2.1). */
export const RESIDENTIAL_CFA_CAP = 78000;

/**
 * PM Surya Ghar central financial assistance for an individual residential
 * rooftop system (spec §2.1):
 *   first 2 kW  → Rs 30,000 / kW
 *   3rd kW      → Rs 18,000
 *   above 3 kW  → capped at Rs 78,000
 */
export function centralSubsidy(kw: number): number {
  if (kw <= 0) return 0;
  if (kw <= 2) return Math.round(kw * 30000);
  if (kw <= 3) return Math.round(60000 + (kw - 2) * 18000);
  return RESIDENTIAL_CFA_CAP;
}

/** CFA for group housing society / RWA common facilities: Rs 18,000/kW up to 500 kW. */
export function societySubsidy(kw: number): number {
  if (kw <= 0) return 0;
  return Math.round(Math.min(kw, GHS_MAX_KW) * GHS_RATE_PER_KW);
}

export function centralSubsidyFor(kw: number, consumerType: ConsumerType = "individual"): number {
  return consumerType === "society" ? societySubsidy(kw) : centralSubsidy(kw);
}

export function getStateTopUp(stateSlug: string): StateTopUp | null {
  const found = STATE_TOP_UPS.find((t) => t.stateSlug === stateSlug);
  if (found) return found;
  if (NO_TOP_UP_STATES.includes(stateSlug)) return noTopUpRecord(stateSlug);
  return null;
}

/** Resolves the capital top-up payable for a given size, honouring size bands and BPL. */
export function stateTopUpAmount(
  topUp: StateTopUp | null,
  kw: number,
  opts: { bpl?: boolean } = {},
): number {
  if (!topUp || topUp.topUpType !== "capital") return 0;
  if (opts.bpl && topUp.bpl && kw <= topUp.bpl.maxKw) return topUp.bpl.amount;
  if (topUp.bands) {
    const band = topUp.bands.find((b) => kw <= b.maxKw);
    if (band) return band.amount;
    return topUp.bands[topUp.bands.length - 1]?.amount ?? 0;
  }
  return topUp.amount ?? 0;
}

/**
 * True when a state top-up is a real figure we cannot vouch for — a capital
 * amount that is budget-dependent or otherwise in flux rather than a standing
 * entitlement. Surfaces should show the number *and* a link to confirm it,
 * rather than presenting it with the same confidence as the central CFA.
 */
export function needsAvailabilityCheck(topUp: StateTopUp | null): boolean {
  return !!topUp && topUp.topUpType === "capital" && topUp.confidence === "approximate" && !topUp.varies;
}

export interface SubsidyInput {
  kw: number;
  stateSlug: string;
  consumerType?: ConsumerType;
  bpl?: boolean;
  /** True when the household is inside the state's income ceiling (states that have one). */
  withinIncomeCeiling?: boolean;
  /** Annual generation in kWh — required to estimate generation-based incentives (Delhi). */
  annualKwh?: number;
}

/**
 * Full subsidy picture for one household. Generation-based incentives are
 * reported separately and never folded into `total`, because they arrive as a
 * monthly stream over two years, not as money off the invoice.
 */
export function subsidyBreakdown(input: SubsidyInput): SubsidyBreakdown {
  const { kw, stateSlug, consumerType = "individual", bpl = false, withinIncomeCeiling, annualKwh } = input;
  const topUp = getStateTopUp(stateSlug);
  const notes: string[] = [];

  const central = centralSubsidyFor(kw, consumerType);

  if (consumerType === "society") {
    notes.push(
      `Group housing societies get Rs ${GHS_RATE_PER_KW.toLocaleString("en-IN")} per kW for common facilities, up to ${GHS_MAX_KW} kW.`,
    );
  } else if (kw > 3) {
    notes.push(`The central subsidy is capped at Rs ${RESIDENTIAL_CFA_CAP.toLocaleString("en-IN")} — a system above 3 kW does not earn more.`);
  }

  let stateCapital = 0;
  if (topUp?.topUpType === "capital" && consumerType === "individual") {
    if (topUp.varies) {
      notes.push(
        `${topUp.agency ?? "The state agency"} runs a top-up but does not publish a single flat amount — it depends on your category or income band. Treat the total below as central subsidy only.`,
      );
    } else if (topUp.incomeCeiling && withinIncomeCeiling === false) {
      notes.push(
        `${topUp.agency ?? "The state"} top-up has a household income ceiling of about Rs ${(topUp.incomeCeiling.minRs / 100000).toFixed(0)}-${(topUp.incomeCeiling.maxRs / 100000).toFixed(0)} lakh, which you indicated you are above.`,
      );
    } else {
      stateCapital = stateTopUpAmount(topUp, kw, { bpl });
      if (bpl && topUp.bpl && kw <= topUp.bpl.maxKw) {
        notes.push("Enhanced BPL top-up applied — you will need to produce your BPL card.");
      }
      if (topUp.separateApplication) {
        notes.push(
          `${topUp.agency ?? "The state"} needs a separate application${topUp.applicationPortal ? ` on ${topUp.applicationPortal}` : ""} — the national portal alone will not release it.`,
        );
      }
    }
  }

  let stateGeneration: SubsidyBreakdown["stateGeneration"] = null;
  if (topUp?.topUpType === "generation" && topUp.generationIncentive) {
    const gi = topUp.generationIncentive;
    const estimatedTotal = annualKwh ? Math.round(annualKwh * (gi.months / 12) * gi.ratePerKwh) : 0;
    stateGeneration = { ratePerKwh: gi.ratePerKwh, months: gi.months, estimatedTotal };
    notes.push(
      `${topUp.agency ?? "Your DISCOM"} pays roughly Rs ${gi.ratePerKwhMin ?? gi.ratePerKwh}-${gi.ratePerKwhMax ?? gi.ratePerKwh} per unit generated for ${gi.months} months instead of a capital top-up. It is not money off the invoice, so it is shown separately.`,
    );
  }

  if (topUp?.status === "paused" || topUp?.status === "exhausted") {
    notes.push(`Warning: the ${topUp.agency ?? "state"} scheme was ${topUp.status} at the last verification. Confirm before you sign.`);
  }

  return {
    kw,
    stateSlug,
    central,
    stateCapital,
    stateGeneration,
    total: central + stateCapital,
    notes,
    topUp,
  };
}
