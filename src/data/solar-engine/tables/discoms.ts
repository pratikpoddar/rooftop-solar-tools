import type { Discom, Slab } from "../types";

const V = "2026-09-08";

/**
 * Domestic tariffs (spec §2.5). This is the least standardised dataset in the
 * product and the spec flags it for real effort in Phase 0 — so every record
 * here carries `confidence`, and the ten priority states get full slab tables
 * while the rest get a single flat effective rate.
 *
 * The slab tables below are composite all-in energy rates (energy charge plus
 * wheeling where the DISCOM bills it separately), calibrated so that the
 * effective rate matches the three anchors the spec quotes: Mumbai ~Rs 8,
 * DGVCL Gujarat ~Rs 5.5, and KSEB Kerala slab 5 at Rs 8.10. They are NOT yet
 * lifted line-by-line from the SERC tariff orders — see VERIFY.md.
 */

type DiscomSeed = Omit<Discom, "lastVerified" | "confidence" | "source"> &
  Partial<Pick<Discom, "lastVerified" | "confidence" | "source">>;

function discom(seed: DiscomSeed): Discom {
  return {
    lastVerified: V,
    confidence: "approximate",
    source: "serc-tariff-orders",
    ...seed,
  };
}

const GUJARAT_SLABS: Slab[] = [
  { from: 0, to: 50, rate: 3.2 },
  { from: 51, to: 100, rate: 3.95 },
  { from: 101, to: 250, rate: 4.9 },
  { from: 251, to: null, rate: 5.6 },
];

const UPPCL_SLABS: Slab[] = [
  { from: 0, to: 100, rate: 3.35 },
  { from: 101, to: 150, rate: 3.85 },
  { from: 151, to: 300, rate: 5.0 },
  { from: 301, to: null, rate: 6.2 },
];

const RAJASTHAN_SLABS: Slab[] = [
  { from: 0, to: 50, rate: 4.75 },
  { from: 51, to: 150, rate: 6.5 },
  { from: 151, to: 300, rate: 7.35 },
  { from: 301, to: null, rate: 7.95 },
];

const KARNATAKA_SLABS: Slab[] = [
  { from: 0, to: 50, rate: 4.6 },
  { from: 51, to: 100, rate: 6.1 },
  { from: 101, to: 200, rate: 7.6 },
  { from: 201, to: null, rate: 8.85 },
];

const TELANGANA_SLABS: Slab[] = [
  { from: 0, to: 50, rate: 1.95 },
  { from: 51, to: 100, rate: 3.1 },
  { from: 101, to: 200, rate: 4.8 },
  { from: 201, to: null, rate: 9.5 },
];

const DELHI_SLABS: Slab[] = [
  { from: 0, to: 200, rate: 3.0 },
  { from: 201, to: 400, rate: 4.5 },
  { from: 401, to: 800, rate: 6.5 },
  { from: 801, to: 1200, rate: 7.0 },
  { from: 1201, to: null, rate: 8.0 },
];

const MP_SLABS: Slab[] = [
  { from: 0, to: 50, rate: 4.21 },
  { from: 51, to: 150, rate: 5.21 },
  { from: 151, to: 300, rate: 6.53 },
  { from: 301, to: null, rate: 6.8 },
];

/** Gujarat: 4 GUVNL discoms + Torrent's licence areas (priced ~8% above GUVNL). */
const GUJARAT: Discom[] = [
  ...(["dgvcl", "mgvcl", "pgvcl", "ugvcl"] as const).map((id, i) =>
    discom({
      id,
      name: { dgvcl: "DGVCL (Surat)", mgvcl: "MGVCL (Vadodara)", pgvcl: "PGVCL (Rajkot)", ugvcl: "UGVCL (north Gujarat)" }[id],
      stateSlug: "gujarat",
      primary: i === 0,
      slabs: GUJARAT_SLABS,
      fixedCharge: 15,
      fixedChargePerKw: true,
      electricityDutyPct: 0.15,
      appcRatePerKwh: 3.0,
      portal: "https://www.guvnl.com",
    }),
  ),
  discom({
    id: "torrent-ahmedabad",
    name: "Torrent Power (Ahmedabad)",
    stateSlug: "gujarat",
    primary: false,
    slabs: GUJARAT_SLABS.map((s) => ({ ...s, rate: Math.round(s.rate * 1.08 * 100) / 100 })),
    fixedCharge: 20,
    fixedChargePerKw: true,
    electricityDutyPct: 0.15,
    appcRatePerKwh: 3.0,
    portal: "https://connect.torrentpower.com",
  }),
];

const MAHARASHTRA: Discom[] = [
  discom({
    id: "msedcl",
    name: "MSEDCL (Mahavitaran)",
    stateSlug: "maharashtra",
    primary: true,
    slabs: [
      { from: 0, to: 100, rate: 4.1 },
      { from: 101, to: 300, rate: 8.2 },
      { from: 301, to: 500, rate: 11.5 },
      { from: 501, to: null, rate: 13.2 },
    ],
    fixedCharge: 128,
    fixedChargePerKw: false,
    electricityDutyPct: 0.16,
    appcRatePerKwh: 3.2,
    portal: "https://www.mahadiscom.in",
  }),
  discom({
    id: "adani-mumbai",
    name: "Adani Electricity Mumbai",
    stateSlug: "maharashtra",
    primary: false,
    slabs: [
      { from: 0, to: 100, rate: 4.0 },
      { from: 101, to: 300, rate: 8.2 },
      { from: 301, to: 500, rate: 11.0 },
      { from: 501, to: null, rate: 12.6 },
    ],
    fixedCharge: 110,
    fixedChargePerKw: false,
    electricityDutyPct: 0.16,
    appcRatePerKwh: 3.2,
    portal: "https://www.adanielectricity.com",
  }),
];

const UP: Discom[] = (
  [
    ["uppcl-mvvnl", "UPPCL — Madhyanchal (Lucknow)", true],
    ["uppcl-pvvnl", "UPPCL — Paschimanchal (Meerut)", false],
    ["uppcl-dvvnl", "UPPCL — Dakshinanchal (Agra)", false],
    ["uppcl-puvvnl", "UPPCL — Purvanchal (Varanasi)", false],
    ["uppcl-kesco", "KESCO (Kanpur)", false],
    ["npcl", "Noida Power Company (NPCL)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "uttar-pradesh",
    primary,
    slabs: UPPCL_SLABS,
    fixedCharge: 110,
    fixedChargePerKw: true,
    electricityDutyPct: 0.05,
    appcRatePerKwh: 3.0,
    portal: "https://www.uppcl.org",
  }),
);

const RAJASTHAN: Discom[] = (
  [
    ["jvvnl", "JVVNL (Jaipur)", true],
    ["jdvvnl", "JdVVNL (Jodhpur)", false],
    ["avvnl", "AVVNL (Ajmer)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "rajasthan",
    primary,
    slabs: RAJASTHAN_SLABS,
    fixedCharge: 230,
    fixedChargePerKw: false,
    electricityDutyPct: 0.06,
    appcRatePerKwh: 3.2,
    portal: "https://energy.rajasthan.gov.in",
  }),
);

const KARNATAKA: Discom[] = (
  [
    ["bescom", "BESCOM (Bengaluru)", true],
    ["hescom", "HESCOM (Hubballi)", false],
    ["mescom", "MESCOM (Mangaluru)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "karnataka",
    primary,
    slabs: KARNATAKA_SLABS,
    fixedCharge: 110,
    fixedChargePerKw: true,
    electricityDutyPct: 0.09,
    appcRatePerKwh: 3.1,
    portal: "https://bescom.karnataka.gov.in",
  }),
);

const TAMIL_NADU: Discom[] = [
  discom({
    id: "tangedco",
    name: "TANGEDCO",
    stateSlug: "tamil-nadu",
    primary: true,
    slabs: [
      { from: 0, to: 100, rate: 0 },
      { from: 101, to: 200, rate: 2.25 },
      { from: 201, to: 400, rate: 4.5 },
      { from: 401, to: 500, rate: 6.0 },
      { from: 501, to: null, rate: 6.75 },
    ],
    fixedCharge: 30,
    fixedChargePerKw: false,
    electricityDutyPct: 0,
    appcRatePerKwh: 2.28,
    portal: "https://www.tnebnet.org",
  }),
];

const TELANGANA: Discom[] = (
  [
    ["tgspdcl", "TGSPDCL (Hyderabad)", true],
    ["tgnpdcl", "TGNPDCL (Warangal)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "telangana",
    primary,
    slabs: TELANGANA_SLABS,
    fixedCharge: 45,
    fixedChargePerKw: false,
    electricityDutyPct: 0.06,
    appcRatePerKwh: 3.3,
    portal: "https://tgsouthernpower.org",
  }),
);

const DELHI: Discom[] = (
  [
    ["brpl", "BSES Rajdhani (BRPL)", true],
    ["bypl", "BSES Yamuna (BYPL)", false],
    ["tpddl", "Tata Power-DDL (TPDDL)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "delhi",
    primary,
    slabs: DELHI_SLABS,
    fixedCharge: 125,
    fixedChargePerKw: true,
    electricityDutyPct: 0.05,
    appcRatePerKwh: 3.3,
    portal: "https://solar.delhi.gov.in",
  }),
);

const KERALA: Discom[] = [
  discom({
    id: "kseb",
    name: "KSEB",
    stateSlug: "kerala",
    primary: true,
    slabs: [
      { from: 0, to: 50, rate: 3.25 },
      { from: 51, to: 100, rate: 4.05 },
      { from: 101, to: 150, rate: 5.1 },
      { from: 151, to: 200, rate: 6.95 },
      { from: 201, to: 250, rate: 8.1 },
      { from: 251, to: null, rate: 8.85 },
    ],
    fixedCharge: 80,
    fixedChargePerKw: false,
    electricityDutyPct: 0.1,
    appcRatePerKwh: 3.2,
    portal: "https://wss.kseb.in",
  }),
];

const MP: Discom[] = (
  [
    ["mpczl", "MPMKVVCL — Central (Bhopal)", true],
    ["mpwzl", "MPPKVVCL — West (Indore)", false],
    ["mpezl", "MPPKVVCL — East (Jabalpur)", false],
  ] as const
).map(([id, name, primary]) =>
  discom({
    id,
    name,
    stateSlug: "madhya-pradesh",
    primary,
    slabs: MP_SLABS,
    fixedCharge: 100,
    fixedChargePerKw: false,
    electricityDutyPct: 0.09,
    appcRatePerKwh: 3.1,
    portal: "https://portal.mpcz.in",
  }),
);

/**
 * Remaining states: one flat effective domestic rate each, pending the slab
 * pass. Rendered with an "approximate" badge and never presented as a slab table.
 */
const FLAT_RATE_DISCOMS: [id: string, name: string, stateSlug: string, rate: number, primary: boolean][] = [
  ["uhbvn", "UHBVN (north Haryana)", "haryana", 6.5, true],
  ["dhbvn", "DHBVN (south Haryana)", "haryana", 6.5, false],
  ["pspcl", "PSPCL", "punjab", 6.8, true],
  ["apspdcl", "APSPDCL (south AP)", "andhra-pradesh", 7.0, true],
  ["apepdcl", "APEPDCL (east AP)", "andhra-pradesh", 7.0, false],
  ["cesc", "CESC (Kolkata)", "west-bengal", 8.4, true],
  ["wbsedcl", "WBSEDCL", "west-bengal", 7.6, false],
  ["nbpdcl", "NBPDCL (north Bihar)", "bihar", 7.0, true],
  ["sbpdcl", "SBPDCL (south Bihar)", "bihar", 7.0, false],
  ["cspdcl", "CSPDCL", "chhattisgarh", 5.5, true],
  ["tpcodl", "TP Central Odisha (TPCODL)", "odisha", 6.3, true],
  ["tpwodl", "TP Western Odisha (TPWODL)", "odisha", 6.3, false],
  ["jbvnl", "JBVNL", "jharkhand", 6.5, true],
  ["upcl", "UPCL", "uttarakhand", 5.8, true],
  ["apdcl", "APDCL", "assam", 7.5, true],
  ["hpseb", "HPSEBL", "himachal-pradesh", 5.0, true],
  ["goa-ed", "Goa Electricity Department", "goa", 4.5, true],
  ["jpdcl", "JPDCL (Jammu)", "jammu-and-kashmir", 4.5, true],
  ["kpdcl", "KPDCL (Kashmir)", "jammu-and-kashmir", 4.5, false],
  ["cepd", "Chandigarh Electricity Department", "chandigarh", 4.8, true],
  ["puducherry-ed", "Puducherry Electricity Department", "puducherry", 5.5, true],
  ["tsecl", "TSECL", "tripura", 7.0, true],
  ["mepdcl", "MePDCL", "meghalaya", 7.5, true],
  ["mspdcl", "MSPDCL", "manipur", 7.5, true],
  ["dops-nagaland", "Nagaland Department of Power", "nagaland", 7.5, true],
  ["apdcl-arunachal", "Arunachal Pradesh Department of Power", "arunachal-pradesh", 6.5, true],
  ["ped-mizoram", "Mizoram Power & Electricity Department", "mizoram", 7.0, true],
  ["sikkim-ed", "Sikkim Energy & Power Department", "sikkim", 5.5, true],
  ["ladakh-pdd", "Ladakh Power Development Department", "ladakh", 4.5, true],
  ["andaman-ed", "A&N Electricity Department", "andaman-and-nicobar-islands", 6.0, true],
  ["dnhdd-ded", "DNH & DD Electricity Department", "dadra-and-nagar-haveli-and-daman-and-diu", 4.0, true],
  ["lakshadweep-ed", "Lakshadweep Electricity Department", "lakshadweep", 6.0, true],
];

const FLAT: Discom[] = FLAT_RATE_DISCOMS.map(([id, name, stateSlug, rate, primary]) =>
  discom({
    id,
    name,
    stateSlug,
    primary,
    slabs: [{ from: 0, to: null, rate }],
    fixedCharge: 60,
    fixedChargePerKw: false,
    electricityDutyPct: 0,
    appcRatePerKwh: 3.2,
    portal: null,
    source: "state-average-effective-rate",
  }),
);

export const DISCOMS: Discom[] = [
  ...GUJARAT,
  ...MAHARASHTRA,
  ...UP,
  ...RAJASTHAN,
  ...KARNATAKA,
  ...TAMIL_NADU,
  ...TELANGANA,
  ...DELHI,
  ...KERALA,
  ...MP,
  ...FLAT,
];

/** States whose slab tables are populated (as opposed to a flat average). */
export const SLAB_STATES = [
  "gujarat",
  "maharashtra",
  "uttar-pradesh",
  "rajasthan",
  "karnataka",
  "tamil-nadu",
  "telangana",
  "delhi",
  "kerala",
  "madhya-pradesh",
];
