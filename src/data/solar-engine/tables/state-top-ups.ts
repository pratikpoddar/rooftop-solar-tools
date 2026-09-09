import type { StateTopUp } from "../types";

const VERIFIED_ON = "2026-09-08";

/**
 * State top-ups on top of the PM Surya Ghar CFA (spec §2.2).
 *
 * Only the six states the spec documents carry real figures. Every other
 * state/UT gets an explicit `topUpType: "none"` record so a page can say
 * "no state top-up published — verify with the nodal agency" instead of
 * silently rendering a blank. Re-verify quarterly: schemes pause when the
 * annual budget is exhausted (spec §12, risk #1).
 */
export const STATE_TOP_UPS: StateTopUp[] = [
  {
    stateSlug: "gujarat",
    agency: "GEDA (Surya Gujarat)",
    topUpType: "capital",
    amount: 10000,
    bands: [{ maxKw: 10, amount: 10000 }],
    varies: false,
    incomeCeiling: null,
    conditions: [
      "Nominally Rs 10,000 for systems from 1 kW to 10 kW, with no income limit.",
      "Budget-dependent and in flux: the state allocation is finite and the scheme has changed terms before. Confirm it is still open and still at this amount with GEDA before you sign anything.",
      "When it is running, it is credited 2-4 weeks after the central subsidy DBT with no separate form.",
    ],
    applicationPortal: "https://suryagujarat.guvnl.in",
    separateApplication: false,
    status: "active",
    /**
     * Deliberately NOT "verified", even though the amount is widely quoted.
     * The figure is budget-dependent rather than a standing entitlement, so
     * presenting it with the same confidence as the central CFA would overstate
     * what a buyer can count on. The badge and the check-availability link are
     * the honest treatment.
     */
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: "geda-surya-gujarat",
  },
  {
    stateSlug: "uttar-pradesh",
    agency: "UPNEDA",
    topUpType: "capital",
    amount: 30000,
    bands: [
      { maxKw: 1, amount: 15000 },
      { maxKw: 2, amount: 30000 },
      { maxKw: Infinity, amount: 30000 },
    ],
    varies: false,
    incomeCeiling: null,
    conditions: [
      "Rs 15,000 per kW for the first 2 kW, capped at Rs 30,000.",
      "Requires a separate application on the UPNEDA portal, in addition to the national portal.",
    ],
    applicationPortal: "https://upneda.org.in",
    separateApplication: true,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "verified",
    source: "upneda",
  },
  {
    stateSlug: "rajasthan",
    agency: "RRECL",
    topUpType: "capital",
    amount: 15000,
    bands: [
      { maxKw: 2, amount: 10000 },
      { maxKw: Infinity, amount: 15000 },
    ],
    bpl: { amount: 30000, maxKw: 1 },
    varies: false,
    incomeCeiling: null,
    conditions: [
      "Rs 10,000 for 1-2 kW; Rs 15,000 for 3 kW and above.",
      "Up to Rs 30,000 for BPL households on a 1 kW system.",
      "First-come, first-served against an annual budget — confirm the budget is still open before you commit.",
      "BPL card required for the enhanced amount.",
    ],
    applicationPortal: "https://energy.rajasthan.gov.in/rrecl",
    separateApplication: true,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "verified",
    source: "rrecl",
  },
  {
    stateSlug: "haryana",
    agency: "HAREDA",
    topUpType: "capital",
    amount: null,
    varies: true,
    incomeCeiling: { minRs: 300000, maxRs: 500000 },
    conditions: [
      "Amount varies by scheme and category — HAREDA does not publish a single flat figure.",
      "Household income ceiling of roughly Rs 3-5 lakh applies.",
      "Separate application within 45 days of commissioning.",
    ],
    applicationPortal: "https://hareda.gov.in",
    separateApplication: true,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: "hareda",
  },
  {
    stateSlug: "delhi",
    agency: "Delhi DISCOMs (BSES Rajdhani / BSES Yamuna / TPDDL)",
    topUpType: "generation",
    amount: null,
    generationIncentive: {
      ratePerKwh: 2.5,
      ratePerKwhMin: 2,
      ratePerKwhMax: 3,
      months: 24,
    },
    varies: false,
    incomeCeiling: null,
    conditions: [
      "Delhi pays a generation-based incentive per unit generated for 24 months instead of a capital top-up.",
      "Claimed through your DISCOM's portal, not the state nodal agency.",
      "Because it is paid on generation, the total depends on how much your roof actually produces.",
    ],
    applicationPortal: "https://solar.delhi.gov.in",
    separateApplication: true,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: "delhi-solar",
  },
  {
    stateSlug: "madhya-pradesh",
    agency: "MPUVN",
    topUpType: "capital",
    amount: null,
    varies: true,
    incomeCeiling: null,
    conditions: [
      "Top-up is linked to an income ceiling; MPUVN does not publish a single flat figure.",
      "Check the MPUVN portal for the current window and amount.",
    ],
    applicationPortal: "https://mpuvn.mp.gov.in",
    separateApplication: true,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: "mpuvn",
  },
];

/**
 * States with no documented residential top-up as of `lastVerified`. Absence of
 * a scheme is itself information a buyer needs, so we state it explicitly.
 */
export const NO_TOP_UP_STATES: string[] = [
  "maharashtra",
  "karnataka",
  "tamil-nadu",
  "telangana",
  "kerala",
  "punjab",
  "andhra-pradesh",
  "west-bengal",
  "bihar",
  "chhattisgarh",
  "odisha",
  "jharkhand",
  "uttarakhand",
  "assam",
  "himachal-pradesh",
  "goa",
  "jammu-and-kashmir",
  "chandigarh",
  "puducherry",
  "tripura",
  "meghalaya",
  "manipur",
  "nagaland",
  "arunachal-pradesh",
  "mizoram",
  "sikkim",
  "ladakh",
  "andaman-and-nicobar-islands",
  "dadra-and-nagar-haveli-and-daman-and-diu",
  "lakshadweep",
];

export function noTopUpRecord(stateSlug: string): StateTopUp {
  return {
    stateSlug,
    agency: null,
    topUpType: "none",
    amount: 0,
    varies: false,
    incomeCeiling: null,
    conditions: [
      "No state-level residential top-up published as of the last verification date.",
      "You still get the full central PM Surya Ghar subsidy.",
    ],
    applicationPortal: null,
    separateApplication: false,
    status: "active",
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: "state-top-up-map",
  };
}
