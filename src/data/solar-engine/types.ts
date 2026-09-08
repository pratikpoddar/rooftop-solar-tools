/**
 * Rooftop Solar India — Numbers Engine types.
 *
 * Rule (spec §2): every tool, page and share card reads from this module.
 * Never hardcode a rupee figure, kWh figure or rate inside a component.
 */

/** How confident we are in a stored number. Rendered as a badge on public pages. */
export type Confidence =
  /** Copied from a primary government/DISCOM source listed in SOURCES.md. */
  | "verified"
  /** Best-effort figure cross-checked against secondary sources; needs a primary-source pass. */
  | "approximate";

export type SchemeStatus = "active" | "paused" | "exhausted";

export interface Verifiable {
  /** ISO date (YYYY-MM-DD). Rendered as "last verified on <date>" wherever the number appears. */
  lastVerified: string;
  confidence: Confidence;
  /** Key into SOURCES.md / sources.ts. */
  source: string;
}

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

export interface State extends Record<string, unknown> {
  /** URL slug, e.g. "gujarat". */
  slug: string;
  name: string;
  /** ISO 3166-2:IN code without the "IN-" prefix, e.g. "GJ". */
  code: string;
  type: "state" | "ut";
  /** Rough rooftop-solar search-demand rank; drives build/verify priority (spec §5). */
  priority: number;
}

export interface City {
  slug: string;
  name: string;
  stateSlug: string;
  /** Generation region key (see generation.ts). */
  region: string;
  /** kWh per kWp per year for this city (spec §2.4). */
  kwhPerKwpYear: number;
  /** Default DISCOM id for tariff lookups. */
  discomId?: string;
  /** Representative PIN prefix, for PIN → city resolution. */
  pinPrefix?: string;
  priority: number;
}

// ---------------------------------------------------------------------------
// Subsidy (spec §2.1, §2.2)
// ---------------------------------------------------------------------------

export type TopUpType = "capital" | "generation" | "none";

export interface GenerationIncentive {
  /** Rs per kWh generated. */
  ratePerKwh: number;
  ratePerKwhMin?: number;
  ratePerKwhMax?: number;
  months: number;
}

export interface StateTopUp extends Verifiable {
  stateSlug: string;
  agency: string | null;
  topUpType: TopUpType;
  /**
   * Flat capital top-up in Rs for a given size, resolved by `amountFor`.
   * null when the scheme exists but the amount is income/category dependent.
   */
  amount: number | null;
  /** Size-banded amounts, evaluated in order; first match wins. */
  bands?: { maxKw: number; amount: number }[];
  /** Enhanced amount for BPL applicants and the size ceiling it applies to. */
  bpl?: { amount: number; maxKw: number };
  generationIncentive?: GenerationIncentive;
  /** True when the rupee value depends on income band / category and cannot be quoted upfront. */
  varies: boolean;
  incomeCeiling?: { minRs: number; maxRs: number } | null;
  conditions: string[];
  applicationPortal: string | null;
  separateApplication: boolean;
  status: SchemeStatus;
}

export interface SubsidyBreakdown {
  kw: number;
  stateSlug: string;
  central: number;
  stateCapital: number;
  /** Present only for generation-incentive states (e.g. Delhi). Not added to `total`. */
  stateGeneration: {
    ratePerKwh: number;
    months: number;
    estimatedTotal: number;
  } | null;
  /** central + stateCapital. Generation incentives are shown separately, never summed in. */
  total: number;
  notes: string[];
  topUp: StateTopUp | null;
}

export type ConsumerType = "individual" | "society";

// ---------------------------------------------------------------------------
// Cost (spec §2.3)
// ---------------------------------------------------------------------------

export interface CostAnchor {
  kw: number;
  min: number;
  max: number;
  /** The figure used in calculations. */
  default: number;
}

export interface CostBreakdown {
  kw: number;
  /** Installed cost before subsidy, after state adjustment. */
  gross: number;
  grossMin: number;
  grossMax: number;
  perWatt: number;
  /** State adjustment applied, as a fraction (e.g. -0.05 for Gujarat). */
  stateAdjustment: number;
  /** Optional extras, quoted separately — never folded into `gross` (spec §2.3). */
  addOns: {
    netMeterCharge: { min: number; max: number; default: number };
    structuralReinforcement: { min: number; max: number; flagged: boolean };
  };
}

// ---------------------------------------------------------------------------
// Generation (spec §2.4)
// ---------------------------------------------------------------------------

export interface GenerationRegion extends Verifiable {
  key: string;
  label: string;
  kwhPerKwpYearMin: number;
  kwhPerKwpYearMax: number;
  /** 12 shares of annual output, Jan→Dec. Normalised to sum to 1 at read time. */
  monthlyFactors: number[];
}

export interface GenerationEstimate {
  kw: number;
  kwhPerKwpYear: number;
  annualKwh: number;
  monthlyKwh: number[];
  dailyAverageKwh: number;
  /** Capacity utilisation factor, as a fraction. */
  cuf: number;
  co2AvoidedTonnesPerYear: number;
  treesEquivalentPerYear: number;
}

// ---------------------------------------------------------------------------
// Tariffs (spec §2.5)
// ---------------------------------------------------------------------------

export interface Slab {
  /** Inclusive lower bound in units (kWh). */
  from: number;
  /** Inclusive upper bound; null means "and above". */
  to: number | null;
  /** Rs per kWh. */
  rate: number;
}

export interface Discom extends Verifiable {
  id: string;
  name: string;
  stateSlug: string;
  /** True when this is the default DISCOM for its state. */
  primary: boolean;
  slabs: Slab[];
  /** Rs per month, or Rs per kW of sanctioned load per month when `fixedChargePerKw`. */
  fixedCharge: number;
  fixedChargePerKw: boolean;
  /** Electricity duty as a fraction of the energy charge. */
  electricityDutyPct: number;
  /** Average power purchase cost, Rs/kWh — the export rate in net-billing states. */
  appcRatePerKwh: number;
  portal: string | null;
}

export interface BillBreakdown {
  units: number;
  energyCharge: number;
  fixedCharge: number;
  duty: number;
  total: number;
  /** total / units. */
  effectiveRatePerUnit: number;
  /** Rate of the highest slab the consumer reaches. */
  marginalRatePerUnit: number;
  slabUsage: { slab: Slab; units: number; amount: number }[];
}

// ---------------------------------------------------------------------------
// Net metering (spec §2.7)
// ---------------------------------------------------------------------------

export type MeteringMechanism = "net-metering" | "net-billing" | "gross-metering";
export type SettlementPeriod = "monthly" | "annual" | "half-yearly";

export interface NetMeteringRule extends Verifiable {
  stateSlug: string;
  mechanism: MeteringMechanism;
  /** Residential sanctioned-load cap in kW; null when uncapped. */
  capKw: number | null;
  settlementPeriod: SettlementPeriod;
  /** How surplus at the end of the settlement period is treated. */
  surplusTreatment: "paid-at-appc" | "lapses" | "carried-forward";
  /** Rs/kWh banking charge levied on exported/banked units. */
  bankingChargePerKwh: number;
  electricityDutyExemption: boolean;
  /** Consumer-facing gotchas the navigator (T7) must surface. */
  gotchas: string[];
  portal: string | null;
}

// ---------------------------------------------------------------------------
// Loans (spec §2.6)
// ---------------------------------------------------------------------------

export interface Bank extends Verifiable {
  id: string;
  name: string;
  /** Annual interest rate, percent. */
  ratePct: number;
  maxCollateralFreeRs: number;
  minTenureYears: number;
  maxTenureYears: number;
  url: string | null;
}

export interface LoanSchedule {
  principal: number;
  ratePct: number;
  tenureYears: number;
  emi: number;
  totalInterest: number;
  totalPayable: number;
}

// ---------------------------------------------------------------------------
// Savings (spec §T3)
// ---------------------------------------------------------------------------

export interface SavingsAssumptions {
  /** Share of generation consumed on site (spec default 0.70). */
  selfConsumptionShare: number;
  tariffEscalationPct: number;
  degradationPct: number;
  omCostYear1: number;
  omEscalationPct: number;
  inverterReplacementCost: number;
  inverterReplacementYear: number;
  horizonYears: number;
}

export interface SavingsYear {
  year: number;
  generationKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  selfConsumptionSaving: number;
  exportCredit: number;
  omCost: number;
  inverterCost: number;
  netSaving: number;
  cumulative: number;
}

export interface SavingsResult {
  /** Total year-1 benefit per month, gross of O&M — the number that belongs next to an EMI. */
  year1MonthlySaving: number;
  year1AnnualSaving: number;
  /**
   * The two halves of that benefit, kept apart because they are different money:
   * `year1BillSaving` comes off the electricity bill and is capped by it, while
   * `year1ExportIncome` is paid to you for surplus units. Presenting only the
   * sum makes a Tamil Nadu household look like it saves more than its whole bill.
   */
  year1BillSaving: number;
  year1ExportIncome: number;
  /** Year-1 saving after O&M, the basis for payback. */
  year1NetSaving: number;
  paybackYears: number;
  lifetimeSaving: number;
  years: SavingsYear[];
  assumptions: SavingsAssumptions;
  mechanism: MeteringMechanism;
  exportRatePerKwh: number;
  notes: string[];
}
