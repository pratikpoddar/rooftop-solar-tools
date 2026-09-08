import type { NetMeteringRule } from "../types";
import { STATES } from "./states";

const V = "2026-09-08";

/**
 * Net-metering rules (spec §2.7). The gotchas the spec singles out are encoded
 * as real fields, not prose, because they change the savings maths: Gujarat's
 * Rs 1.5/kWh banking charge, UP and Tamil Nadu being net-BILLING (exports at
 * APPC, not 1:1), Maharashtra's effective 999 kW cap, and the annual-lapse
 * states where an oversized system loses its surplus at financial year end.
 */
const OVERRIDES: Partial<Record<string, Partial<NetMeteringRule>>> = {
  gujarat: {
    mechanism: "net-metering",
    settlementPeriod: "annual",
    surplusTreatment: "paid-at-appc",
    bankingChargePerKwh: 1.5,
    electricityDutyExemption: true,
    confidence: "verified",
    gotchas: [
      "Gujarat levies a Rs 1.5/kWh banking charge on units you export and draw back, settled in 15-minute blocks — so exporting is materially worse than consuming your own generation.",
      "Size the system to your daytime load, not your total bill, or the banking charge eats the benefit.",
    ],
    portal: "https://suryagujarat.guvnl.in",
  },
  "uttar-pradesh": {
    mechanism: "net-billing",
    settlementPeriod: "monthly",
    surplusTreatment: "paid-at-appc",
    confidence: "verified",
    gotchas: [
      "Uttar Pradesh runs net BILLING, not net metering: units you export are bought at the APPC rate, not credited 1:1 against your retail tariff.",
      "That roughly halves the value of every exported unit, so self-consumption during the day is where the savings are.",
    ],
    portal: "https://upneda.org.in",
  },
  "tamil-nadu": {
    mechanism: "net-billing",
    settlementPeriod: "monthly",
    surplusTreatment: "paid-at-appc",
    confidence: "verified",
    gotchas: [
      "Tamil Nadu runs net BILLING for new residential connections: exports are settled at APPC, not 1:1.",
      "Combined with 100 free units for domestic consumers, small systems in Tamil Nadu pay back slowly — check the numbers before oversizing.",
    ],
    portal: "https://www.tnebnet.org",
  },
  maharashtra: {
    capKw: 999,
    settlementPeriod: "annual",
    confidence: "verified",
    gotchas: [
      "MSEDCL and the Mumbai DISCOMs effectively cap rooftop net metering at 999 kW despite the 5 MW figure in the regulation — irrelevant for a home, relevant for a housing society.",
      "Sanctioned load is the practical ceiling for a residential connection; raising it is a separate DISCOM application.",
    ],
  },
  bihar: {
    settlementPeriod: "annual",
    surplusTreatment: "lapses",
    confidence: "verified",
    gotchas: [
      "Unused export credits LAPSE at the end of the financial year in Bihar — an oversized system simply gives away the surplus.",
      "Size to your own annual consumption, not to your roof area.",
    ],
  },
  odisha: {
    settlementPeriod: "annual",
    surplusTreatment: "lapses",
    confidence: "verified",
    gotchas: [
      "Unused export credits LAPSE at the end of the financial year in Odisha — do not oversize.",
    ],
  },
  delhi: {
    settlementPeriod: "annual",
    electricityDutyExemption: true,
    gotchas: [
      "Delhi combines 1:1 net metering with a generation-based incentive paid per unit for 24 months.",
      "Credits carry forward within the year and are settled at the end of the settlement period.",
    ],
    portal: "https://solar.delhi.gov.in",
  },
};

function defaults(stateSlug: string): NetMeteringRule {
  return {
    stateSlug,
    mechanism: "net-metering",
    capKw: null,
    settlementPeriod: "annual",
    surplusTreatment: "paid-at-appc",
    bankingChargePerKwh: 0,
    electricityDutyExemption: false,
    gotchas: [
      "Rules not yet verified against this state's SERC regulation — treat the export side of the estimate as indicative.",
      "Your sanctioned load is the practical ceiling on system size for a residential connection.",
    ],
    portal: null,
    lastVerified: V,
    confidence: "approximate",
    source: "net-metering-state-rules",
  };
}

export const NET_METERING_RULES: NetMeteringRule[] = STATES.map((s) => ({
  ...defaults(s.slug),
  ...(OVERRIDES[s.slug] ?? {}),
}));
