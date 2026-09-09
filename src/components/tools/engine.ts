/**
 * Single client-side entry point into the Numbers Engine.
 *
 * Tools import from here rather than from "@/data/solar-engine" directly, so
 * there is one place to see — and one place to trim — everything that crosses
 * into the browser bundle.
 */
export {
  BANKS,
  COLLATERAL_FREE_CAP,
  ENGINE_VERSION,
  ESTIMATE_DISCLAIMER,
  MONTH_LABELS,
  ROOF_UTILISATION,
  STANDARD_SIZES,
  STATES,
  centralSubsidy,
  citiesInState,
  computeBill,
  defaultLoanAmount,
  discomsInState,
  emi,
  estimateGeneration,
  estimateSavings,
  formatIndianNumber,
  getCity,
  getDiscom,
  getNetMeteringRule,
  getState,
  hasSlabTable,
  kwLabel,
  loanSchedule,
  needsAvailabilityCheck,
  netCost,
  primaryDiscom,
  recommendSize,
  resolveDiscom,
  roofAreaForKw,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  systemCost,
  unitsFromBill,
  verifiedDate,
  years,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_SANCTIONED_LOAD_KW,
} from "@/data/solar-engine";

export type { Bank, Discom, SavingsResult, SubsidyBreakdown } from "@/data/solar-engine";

export { NATIONAL_PORTAL as NATIONAL_PORTAL_FALLBACK } from "@/lib/site";
