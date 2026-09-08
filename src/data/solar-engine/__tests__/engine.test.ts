import { describe, expect, it } from "vitest";
import {
  BANKS,
  CITIES,
  DISCOMS,
  GENERATION_REGIONS,
  NATIONAL_KWH_PER_KWP,
  STATES,
  centralSubsidy,
  cityKwhPerKwp,
  computeBill,
  emi,
  estimateGeneration,
  estimateSavings,
  exportRatePerKwh,
  getDiscom,
  getNetMeteringRule,
  kwFromRoofArea,
  monthlyFactors,
  netCost,
  primaryDiscom,
  recommendSize,
  roofAreaForKw,
  rupeesShort,
  societySubsidy,
  subsidyBreakdown,
  surplusLapses,
  systemCost,
  unitsFromBill,
} from "../index";

// ---------------------------------------------------------------------------
// §2.1 Central subsidy
// ---------------------------------------------------------------------------
describe("central subsidy (spec §2.1)", () => {
  it("pays Rs 30,000/kW for the first 2 kW", () => {
    expect(centralSubsidy(1)).toBe(30000);
    expect(centralSubsidy(2)).toBe(60000);
  });

  it("pays Rs 18,000 for the third kW", () => {
    expect(centralSubsidy(3)).toBe(78000);
    expect(centralSubsidy(2.5)).toBe(69000);
  });

  it("caps at Rs 78,000 above 3 kW", () => {
    expect(centralSubsidy(5)).toBe(78000);
    expect(centralSubsidy(10)).toBe(78000);
    expect(centralSubsidy(100)).toBe(78000);
  });

  it("is zero or better for degenerate sizes", () => {
    expect(centralSubsidy(0)).toBe(0);
    expect(centralSubsidy(-3)).toBe(0);
  });

  it("gives housing societies Rs 18,000/kW up to 500 kW", () => {
    expect(societySubsidy(100)).toBe(1800000);
    expect(societySubsidy(500)).toBe(9000000);
    expect(societySubsidy(700)).toBe(9000000);
  });
});

// ---------------------------------------------------------------------------
// §2.2 State top-ups — the spec's own worked example
// ---------------------------------------------------------------------------
describe("state top-ups (spec §2.2)", () => {
  it("reproduces the spec headline: 3 kW in Gujarat = Rs 88,000", () => {
    const s = subsidyBreakdown({ kw: 3, stateSlug: "gujarat" });
    expect(s.central).toBe(78000);
    expect(s.stateCapital).toBe(10000);
    expect(s.total).toBe(88000);
  });

  it("applies UP's Rs 15,000/kW banding, capped at Rs 30,000", () => {
    expect(subsidyBreakdown({ kw: 1, stateSlug: "uttar-pradesh" }).stateCapital).toBe(15000);
    expect(subsidyBreakdown({ kw: 2, stateSlug: "uttar-pradesh" }).stateCapital).toBe(30000);
    expect(subsidyBreakdown({ kw: 5, stateSlug: "uttar-pradesh" }).stateCapital).toBe(30000);
  });

  it("applies Rajasthan's size bands and the enhanced BPL amount", () => {
    expect(subsidyBreakdown({ kw: 2, stateSlug: "rajasthan" }).stateCapital).toBe(10000);
    expect(subsidyBreakdown({ kw: 3, stateSlug: "rajasthan" }).stateCapital).toBe(15000);
    expect(subsidyBreakdown({ kw: 1, stateSlug: "rajasthan", bpl: true }).stateCapital).toBe(30000);
    // BPL enhancement only applies up to 1 kW
    expect(subsidyBreakdown({ kw: 3, stateSlug: "rajasthan", bpl: true }).stateCapital).toBe(15000);
  });

  it("never quotes a rupee figure for a top-up whose amount varies", () => {
    const hr = subsidyBreakdown({ kw: 3, stateSlug: "haryana" });
    expect(hr.stateCapital).toBe(0);
    expect(hr.total).toBe(78000);
    expect(hr.notes.join(" ")).toMatch(/does not publish a single flat amount/);
  });

  it("keeps Delhi's generation incentive out of the headline total", () => {
    const gen = estimateGeneration({ kw: 3, citySlug: "delhi" });
    const dl = subsidyBreakdown({ kw: 3, stateSlug: "delhi", annualKwh: gen.annualKwh });
    expect(dl.total).toBe(78000);
    expect(dl.stateGeneration).not.toBeNull();
    expect(dl.stateGeneration!.months).toBe(24);
    // 3 kW × 1500 kWh × 2 years × Rs 2.50
    expect(dl.stateGeneration!.estimatedTotal).toBe(22500);
  });

  it("says so explicitly when a state has no top-up", () => {
    const mh = subsidyBreakdown({ kw: 3, stateSlug: "maharashtra" });
    expect(mh.total).toBe(78000);
    expect(mh.topUp?.topUpType).toBe("none");
  });

  it("covers every state and UT with a top-up record", () => {
    for (const s of STATES) {
      expect(subsidyBreakdown({ kw: 3, stateSlug: s.slug }).topUp, s.slug).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// §2.3 Cost
// ---------------------------------------------------------------------------
describe("system cost (spec §2.3)", () => {
  it("matches the anchor defaults exactly", () => {
    expect(systemCost(1).gross).toBe(58000);
    expect(systemCost(2).gross).toBe(115000);
    expect(systemCost(3).gross).toBe(172000);
    expect(systemCost(5).gross).toBe(285000);
    expect(systemCost(10).gross).toBe(570000);
  });

  it("stays inside the published Rs 50-65/W band", () => {
    for (const kw of [1, 2, 3, 5, 10]) {
      const c = systemCost(kw);
      expect(c.perWatt).toBeGreaterThanOrEqual(50);
      expect(c.perWatt).toBeLessThanOrEqual(65);
    }
  });

  it("interpolates between anchors monotonically", () => {
    expect(systemCost(4).gross).toBeGreaterThan(systemCost(3).gross);
    expect(systemCost(4).gross).toBeLessThan(systemCost(5).gross);
  });

  it("applies the state adjustment factors the spec gives", () => {
    expect(systemCost(3, "gujarat").gross).toBe(Math.round(172000 * 0.95));
    expect(systemCost(3, "delhi").gross).toBe(Math.round(172000 * 1.08));
    expect(systemCost(3, "kerala").gross).toBe(172000);
  });

  it("never lets net cost go negative", () => {
    expect(netCost(1, 999999)).toBe(0);
  });

  it("keeps add-ons out of the headline gross cost", () => {
    const c = systemCost(3);
    expect(c.gross).toBe(172000);
    expect(c.addOns.netMeterCharge.default).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// §2.4 Generation
// ---------------------------------------------------------------------------
describe("generation (spec §2.4)", () => {
  it("uses the city figures the spec quotes verbatim", () => {
    expect(cityKwhPerKwp("mumbai")).toBe(1425);
    expect(cityKwhPerKwp("bengaluru")).toBe(1550);
    expect(cityKwhPerKwp("hyderabad")).toBe(1550);
    expect(cityKwhPerKwp("chennai")).toBe(1450);
    expect(cityKwhPerKwp("delhi")).toBe(1500);
    expect(cityKwhPerKwp("jaipur")).toBe(1700);
    expect(cityKwhPerKwp("pune")).toBe(1575);
    expect(cityKwhPerKwp("kochi")).toBe(1300);
    expect(cityKwhPerKwp("kolkata")).toBe(1250);
  });

  it("carries all 100 cities and maps each to a real state and region", () => {
    expect(CITIES).toHaveLength(100);
    const slugs = new Set(STATES.map((s) => s.slug));
    const regions = new Set(GENERATION_REGIONS.map((r) => r.key));
    for (const c of CITIES) {
      expect(slugs.has(c.stateSlug), c.slug).toBe(true);
      expect(regions.has(c.region), c.slug).toBe(true);
    }
  });

  it("points every city at a DISCOM that exists", () => {
    for (const c of CITIES) {
      if (!c.discomId) continue;
      expect(getDiscom(c.discomId), `${c.slug} → ${c.discomId}`).toBeDefined();
    }
  });

  it("gives every state a primary DISCOM", () => {
    for (const s of STATES) {
      expect(primaryDiscom(s.slug), s.slug).toBeDefined();
    }
  });

  it("hits the national average of 1,500 kWh/kWp and ~17% CUF", () => {
    const g = estimateGeneration({ kw: 1 });
    expect(g.kwhPerKwpYear).toBe(NATIONAL_KWH_PER_KWP);
    expect(g.annualKwh).toBe(1500);
    expect(g.dailyAverageKwh).toBeCloseTo(4.1, 1);
    expect(g.cuf).toBeGreaterThan(0.16);
    expect(g.cuf).toBeLessThan(0.18);
  });

  it("normalises every region's monthly factors to exactly 1", () => {
    for (const r of GENERATION_REGIONS) {
      const sum = monthlyFactors(r.key).reduce((a, b) => a + b, 0);
      expect(sum, r.key).toBeCloseTo(1, 10);
    }
  });

  it("reproduces the monsoon dips the spec anchors on", () => {
    const west = monthlyFactors("west-coast-monsoon");
    // Mumbai July ≈ 37% of March
    expect((west[6] / west[2]) * 100).toBeCloseTo(37, 0);
    const nw = monthlyFactors("northwest-arid");
    // Jaipur July ≈ 58% of March
    expect((nw[6] / nw[2]) * 100).toBeCloseTo(58, 0);
  });

  it("conserves annual energy across the 12 monthly buckets", () => {
    const g = estimateGeneration({ kw: 3, citySlug: "mumbai" });
    const sum = g.monthlyKwh.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - g.annualKwh)).toBeLessThan(12);
  });

  it("degrades output by 0.7% a year", () => {
    const y1 = estimateGeneration({ kw: 3, citySlug: "pune", year: 1 }).annualKwh;
    const y25 = estimateGeneration({ kw: 3, citySlug: "pune", year: 25 }).annualKwh;
    expect(y1).toBe(3 * 1575);
    expect(y25 / y1).toBeCloseTo(Math.pow(0.993, 24), 3);
  });

  it("reports CO2 and trees consistent with the spec's 1 kW ≈ 1.5 t ≈ 25 trees", () => {
    const g = estimateGeneration({ kw: 1 });
    expect(g.co2AvoidedTonnesPerYear).toBeCloseTo(1.5, 1);
    expect(g.treesEquivalentPerYear).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// §2.5 Tariffs
// ---------------------------------------------------------------------------
describe("tariffs (spec §2.5)", () => {
  it("bills slab by slab without double-counting the boundary unit", () => {
    const d = getDiscom("kseb")!;
    // 50 units all in slab 1 at Rs 3.25
    expect(computeBill(50, d).energyCharge).toBeCloseTo(162.5, 2);
    // the 51st unit is charged at slab 2
    expect(computeBill(51, d).energyCharge).toBeCloseTo(162.5 + 4.05, 2);
  });

  it("matches the spec's KSEB slab-5 rate of Rs 8.10", () => {
    const d = getDiscom("kseb")!;
    expect(computeBill(230, d).marginalRatePerUnit).toBe(8.1);
  });

  it("lands on the spec's effective-rate anchors", () => {
    // "Mumbai ~Rs 8"
    expect(computeBill(250, getDiscom("adani-mumbai")!).effectiveRatePerUnit).toBeCloseTo(8, 0);
    // "DGVCL Gujarat ~Rs 5.5"
    expect(computeBill(300, getDiscom("dgvcl")!).effectiveRatePerUnit).toBeCloseTo(5.5, 0);
  });

  it("handles Tamil Nadu's free first 100 units", () => {
    const d = getDiscom("tangedco")!;
    expect(computeBill(100, d).energyCharge).toBe(0);
    expect(computeBill(150, d).energyCharge).toBeCloseTo(112.5, 2);
  });

  it("round-trips bill → units → bill", () => {
    for (const id of ["dgvcl", "msedcl", "uppcl-mvvnl", "kseb", "bescom", "tangedco", "brpl"]) {
      const d = getDiscom(id)!;
      for (const u of [80, 150, 250, 400, 700]) {
        // Inside a free slab the mapping is genuinely not invertible — a Tamil
        // Nadu bill of just the fixed charge is consistent with 0-100 units.
        if (u <= (d.slabs.find((sl) => sl.rate === 0)?.to ?? 0)) continue;
        const bill = computeBill(u, d).total;
        const back = unitsFromBill(bill, d);
        expect(Math.abs(back - u), `${id} @ ${u}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("credits the whole free band when a bill only covers the fixed charge", () => {
    const d = getDiscom("tangedco")!;
    // Rs 30 in Tamil Nadu is consistent with anything from 0 to 100 units; we
    // read it as 100 because under-reading consumption undersizes the system.
    expect(unitsFromBill(computeBill(0, d).total, d)).toBe(100);
  });

  it("returns zero units for a bill below the fixed charge", () => {
    expect(unitsFromBill(10, getDiscom("brpl")!)).toBe(0);
  });

  it("gives every DISCOM slabs that start at zero and rise", () => {
    for (const d of DISCOMS) {
      expect(d.slabs[0].from, d.id).toBe(0);
      expect(d.slabs[d.slabs.length - 1].to, d.id).toBeNull();
      for (let i = 1; i < d.slabs.length; i++) {
        expect(d.slabs[i].rate, `${d.id} slab ${i}`).toBeGreaterThanOrEqual(d.slabs[i - 1].rate);
        expect(d.slabs[i].from, `${d.id} slab ${i}`).toBe((d.slabs[i - 1].to ?? 0) + 1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// §2.6 Loans
// ---------------------------------------------------------------------------
describe("loans (spec §2.6)", () => {
  it("computes the standard EMI formula", () => {
    // Rs 1,00,000 at 12% for 1 year → Rs 8,885
    expect(emi(100000, 12, 1)).toBe(8885);
  });

  it("reproduces the spec's 3 kW hook: EMI ~Rs 1,100-1,200 on the net cost", () => {
    const kw = 3;
    const cost = systemCost(kw).gross;
    const subsidy = subsidyBreakdown({ kw, stateSlug: "maharashtra" }).total;
    const loan = Math.min(cost - subsidy, 200000);
    const e = emi(loan, 7.15, 10);
    expect(e).toBeGreaterThan(1000);
    expect(e).toBeLessThan(1250);
  });

  it("keeps every bank inside the scheme's collateral-free ceiling", () => {
    for (const b of BANKS) {
      expect(b.maxCollateralFreeRs, b.id).toBe(200000);
      expect(b.ratePct, b.id).toBeGreaterThan(6);
      expect(b.ratePct, b.id).toBeLessThan(9);
    }
    expect(BANKS.find((b) => b.id === "sbi")!.ratePct).toBe(7.15);
    expect(BANKS.find((b) => b.id === "canara")!.ratePct).toBe(7.3);
    expect(BANKS.find((b) => b.id === "union")!.ratePct).toBe(7.35);
  });

  it("returns zero for a zero-principal loan", () => {
    expect(emi(0, 7.15, 10)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// §2.7 Net metering
// ---------------------------------------------------------------------------
describe("net metering (spec §2.7)", () => {
  it("treats UP and Tamil Nadu as net BILLING, settled at APPC", () => {
    for (const s of ["uttar-pradesh", "tamil-nadu"]) {
      expect(getNetMeteringRule(s)!.mechanism, s).toBe("net-billing");
      const { basis, rate } = exportRatePerKwh(s, 9);
      expect(basis, s).toBe("appc");
      expect(rate, s).toBeLessThan(9);
    }
  });

  it("credits exports at retail under net metering, less Gujarat's banking charge", () => {
    const mh = exportRatePerKwh("maharashtra", 8.2);
    expect(mh.basis).toBe("retail");
    expect(mh.rate).toBe(8.2);

    const gj = exportRatePerKwh("gujarat", 5.6);
    expect(gj.bankingCharge).toBe(1.5);
    expect(gj.rate).toBeCloseTo(4.1, 2);
  });

  it("flags the annual-lapse states", () => {
    expect(surplusLapses("bihar")).toBe(true);
    expect(surplusLapses("odisha")).toBe(true);
    expect(surplusLapses("gujarat")).toBe(false);
  });

  it("carries Maharashtra's effective 999 kW cap", () => {
    expect(getNetMeteringRule("maharashtra")!.capKw).toBe(999);
  });

  it("has a rule for every state and UT", () => {
    for (const s of STATES) {
      expect(getNetMeteringRule(s.slug), s.slug).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// T2 sizing and T4 roof
// ---------------------------------------------------------------------------
describe("sizing (spec §T2, §T4)", () => {
  it("recommends a size that offsets most of consumption, rounded to a standard size", () => {
    const r = recommendSize({ stateSlug: "maharashtra", citySlug: "pune", monthlyUnits: 400, sanctionedLoadKw: 5 });
    expect(r.annualUnits).toBe(4800);
    // 4800 × 0.85 / 1575 ≈ 2.6 kW → 3 kW
    expect(r.idealKw).toBeCloseTo(2.6, 1);
    expect(r.recommendedKw).toBe(3);
  });

  it("derives units from a rupee bill when the user has no unit count", () => {
    const r = recommendSize({ stateSlug: "kerala", citySlug: "kochi", monthlyBill: 2500 });
    expect(r.monthlyUnits).toBeGreaterThan(100);
    expect(r.notes.join(" ")).toMatch(/Estimated/);
  });

  it("never recommends more than the sanctioned load", () => {
    const r = recommendSize({ stateSlug: "delhi", citySlug: "delhi", monthlyUnits: 1200, sanctionedLoadKw: 3 });
    expect(r.recommendedKw).toBeLessThanOrEqual(3);
    expect(r.cappedBySanctionedLoad).toBe(true);
  });

  it("uses 100 sq ft per kW with an obstruction allowance", () => {
    expect(roofAreaForKw(3).usableSqft).toBe(300);
    expect(roofAreaForKw(3).grossSqft).toBe(429);
    expect(kwFromRoofArea(500)).toBe(3.5);
    expect(kwFromRoofArea(50, "sqm")).toBeCloseTo(3.8, 1);
  });
});

// ---------------------------------------------------------------------------
// T3 savings
// ---------------------------------------------------------------------------
describe("savings and payback (spec §T3)", () => {
  const base = {
    kw: 3,
    stateSlug: "maharashtra",
    citySlug: "pune",
    discomId: "msedcl",
    monthlyUnits: 400,
    netCost: netCost(3, subsidyBreakdown({ kw: 3, stateSlug: "maharashtra" }).total),
  };

  it("projects the full 25-year horizon", () => {
    const s = estimateSavings(base);
    expect(s.years).toHaveLength(25);
    expect(s.years[0].year).toBe(1);
    expect(s.years[24].year).toBe(25);
  });

  it("produces a payback well inside the panel warranty", () => {
    const s = estimateSavings(base);
    expect(s.paybackYears).toBeGreaterThan(1.5);
    expect(s.paybackYears).toBeLessThan(10);
  });

  it("never saves more than the bill, less the fixed charges that survive anyway", () => {
    // The invariant that catches over-crediting exports at the pre-solar
    // marginal rate — the failure mode this model is written to avoid.
    const cases = [
      { stateSlug: "maharashtra", citySlug: "pune", discomId: "msedcl", monthlyUnits: 400, kw: 3 },
      { stateSlug: "maharashtra", citySlug: "pune", discomId: "msedcl", monthlyUnits: 150, kw: 10 },
      { stateSlug: "gujarat", citySlug: "rajkot", discomId: "pgvcl", monthlyUnits: 300, kw: 5 },
      { stateSlug: "kerala", citySlug: "kochi", discomId: "kseb", monthlyUnits: 200, kw: 5 },
      { stateSlug: "delhi", citySlug: "delhi", discomId: "brpl", monthlyUnits: 500, kw: 5 },
    ];
    for (const c of cases) {
      const d = getDiscom(c.discomId)!;
      const bill = computeBill(c.monthlyUnits, d);
      const s = estimateSavings({ ...c, netCost: 100000 });
      const ceiling = (bill.total - bill.fixedCharge) * 12;
      // The bill-side component is capped by the bill. Surplus sold to the
      // DISCOM at APPC is separate income and is reported separately.
      expect(s.years[0].selfConsumptionSaving, `${c.stateSlug} ${c.kw}kW @ ${c.monthlyUnits}u`).toBeLessThanOrEqual(
        Math.round(ceiling) + 1,
      );
    }
  });

  it("shows diminishing returns once a system outgrows the household", () => {
    const small = estimateSavings({ ...base, kw: 3 });
    const huge = estimateSavings({ ...base, kw: 10 });
    // 10 kW generates 3.3x the units but can only erase the same one bill; the
    // rest is surplus sold at APPC, worth a fraction of the retail rate.
    const genRatio = 10 / 3;
    expect(huge.year1AnnualSaving / small.year1AnnualSaving).toBeLessThan(genRatio * 0.7);
    expect(huge.years[0].selfConsumptionSaving).toBeLessThanOrEqual(small.years[0].selfConsumptionSaving * 1.3);
  });

  it("warns when the system is sized well beyond the household's consumption", () => {
    const s = estimateSavings({ ...base, kw: 10, monthlyUnits: 120 });
    expect(s.notes.join(" ")).toMatch(/more than you consume|oversiz/i);
  });

  it("beats the EMI for the spec's headline 3 kW case", () => {
    const s = estimateSavings(base);
    const e = emi(Math.min(base.netCost, 200000), 7.15, 10);
    expect(s.year1MonthlySaving).toBeGreaterThan(e);
  });

  it("charges O&M every year and the inverter in year 13 only", () => {
    const s = estimateSavings(base);
    expect(s.years[0].omCost).toBe(3000);
    expect(s.years[12].inverterCost).toBe(25000);
    expect(s.years[11].inverterCost).toBe(0);
    expect(s.years[13].inverterCost).toBe(0);
  });

  it("accumulates cumulative savings monotonically apart from the inverter year", () => {
    const s = estimateSavings(base);
    for (let i = 1; i < s.years.length; i++) {
      if (s.years[i].inverterCost > 0) continue;
      expect(s.years[i].cumulative).toBeGreaterThan(s.years[i - 1].cumulative);
    }
    expect(s.lifetimeSaving).toBe(s.years[24].cumulative);
  });

  it("never self-consumes more than the household actually uses", () => {
    const s = estimateSavings({ ...base, kw: 10, monthlyUnits: 100 });
    for (const y of s.years) {
      expect(y.selfConsumedKwh).toBeLessThanOrEqual(1200);
    }
  });

  it("values a net-billing state's exports lower than a net-metering state's", () => {
    const common = { kw: 5, monthlyUnits: 300, netCost: 200000 };
    const up = estimateSavings({ ...common, stateSlug: "uttar-pradesh", citySlug: "lucknow", discomId: "uppcl-mvvnl" });
    expect(up.mechanism).toBe("net-billing");
    expect(up.exportRatePerKwh).toBeLessThan(computeBill(300, getDiscom("uppcl-mvvnl")!).marginalRatePerUnit);
    expect(up.notes.join(" ")).toMatch(/net billing|paid at/i);
  });

  it("drops lapsing surplus in annual-lapse states", () => {
    const args = { kw: 10, monthlyUnits: 100, netCost: 400000, citySlug: "patna" } as const;
    const bihar = estimateSavings({ ...args, stateSlug: "bihar", discomId: "nbpdcl" });
    const jharkhand = estimateSavings({ ...args, stateSlug: "jharkhand", discomId: "jbvnl" });
    expect(bihar.years[0].exportCredit).toBeLessThan(jharkhand.years[0].exportCredit);
  });

  it("works for every state without throwing", () => {
    for (const s of STATES) {
      const r = estimateSavings({ kw: 3, stateSlug: s.slug, monthlyUnits: 300, netCost: 94000 });
      expect(Number.isFinite(r.lifetimeSaving), s.slug).toBe(true);
      expect(r.year1AnnualSaving, s.slug).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
describe("Indic number formatting (spec §7)", () => {
  it("uses lakh and crore, never 100k", () => {
    expect(rupeesShort(218000)).toBe("Rs 2.18 lakh");
    expect(rupeesShort(4100000)).toBe("Rs 41 lakh");
    expect(rupeesShort(14000000)).toBe("Rs 1.4 crore");
    expect(rupeesShort(78000)).toBe("Rs 78,000");
  });
});

// ---------------------------------------------------------------------------
// Presentation invariants — the numbers as a reader will read them
// ---------------------------------------------------------------------------
describe("bill saving and export income are reported separately", () => {
  it("splits the year-1 benefit into its two components", () => {
    const s = estimateSavings({
      kw: 3,
      stateSlug: "tamil-nadu",
      citySlug: "chennai",
      discomId: "tangedco",
      monthlyUnits: 300,
      netCost: 94000,
    });
    expect(s.year1BillSaving + s.year1ExportIncome).toBe(s.year1AnnualSaving);
    expect(s.year1ExportIncome).toBeGreaterThan(0);
  });

  it("keeps the bill-side half inside the bill even where the total exceeds it", () => {
    // Tamil Nadu's 100 free units make the bill small while net billing still
    // pays for exports, so the total benefit legitimately beats the bill.
    const d = getDiscom("tangedco")!;
    const annualBill = computeBill(300, d).total * 12;
    const s = estimateSavings({
      kw: 3,
      stateSlug: "tamil-nadu",
      citySlug: "chennai",
      discomId: "tangedco",
      monthlyUnits: 300,
      netCost: 94000,
    });
    expect(s.year1BillSaving).toBeLessThanOrEqual(annualBill);
    expect(s.year1AnnualSaving).toBeGreaterThan(annualBill - computeBill(300, d).fixedCharge * 12);
  });

  it("reports no export income where every exported unit nets 1:1 instead", () => {
    // A 1 kW system on a 600-unit household exports its usual 30% share, but
    // under net metering all of it offsets grid draw the household still has —
    // so it lands in the bill saving, and surplus income is nil.
    const s = estimateSavings({
      kw: 1,
      stateSlug: "maharashtra",
      citySlug: "pune",
      discomId: "msedcl",
      monthlyUnits: 600,
      netCost: 28000,
    });
    expect(s.years[0].exportedKwh).toBeGreaterThan(0);
    expect(s.year1ExportIncome).toBe(0);
    expect(s.year1BillSaving).toBe(s.year1AnnualSaving);
  });
});
