import {
  RESIDENTIAL_CFA_CAP,
  STANDARD_SIZES,
  cityKwhPerKwp,
  citiesInState,
  computeBill,
  effectiveRate,
  emi,
  estimateGeneration,
  estimateSavings,
  formatIndianNumber,
  getCity,
  getNetMeteringRule,
  getState,
  getStateTopUp,
  needsAvailabilityCheck,
  netCost,
  peakAndTrough,
  primaryDiscom,
  recommendSize,
  resolveDiscom,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  systemCost,
  years as formatYears,
  MONTH_LABELS,
} from "@/data/solar-engine";
import type { City, State } from "@/data/solar-engine";

/**
 * Copy generation for the programmatic pages (spec §5).
 *
 * Every sentence with a number in it is produced here from the engine, so a
 * landing page and the calculator embedded on it can never disagree — which is
 * the whole point of having one numbers engine.
 */

/** The size we use for worked examples throughout the site. */
export const EXAMPLE_KW = 3;
/** Representative domestic consumption for a worked example, in units/month. */
export const EXAMPLE_UNITS = 300;

// ---------------------------------------------------------------------------
// State subsidy pages
// ---------------------------------------------------------------------------

export interface StateSubsidyPage {
  state: State;
  title: string;
  h1: string;
  description: string;
  lede: string;
  total: number;
  rows: { size: string; central: string; topUp: string; total: string; cost: string; net: string }[];
  worked: {
    kw: number;
    discomName: string;
    units: number;
    bill: number;
    kwhPerKwp: number;
    annualKwh: number;
    monthlySaving: number;
    monthlyBillSaving: number;
    monthlyExportIncome: number;
    payback: string;
    lifetime: string;
    net: number;
    emi: number;
  };
  faqs: { q: string; a: string }[];
  lastVerified: string;
  confidence: "verified" | "approximate";
  /** The state half is budget-dependent; show a check-availability link. */
  provisionalTopUp: boolean;
}

const YEAR = 2026;

export function buildStateSubsidyPage(stateSlug: string): StateSubsidyPage | null {
  const state = getState(stateSlug);
  if (!state) return null;

  const topUp = getStateTopUp(stateSlug);
  const example = subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug });
  const total = example.total;
  const agency = topUp?.agency ?? null;

  const rows = STANDARD_SIZES.map((kw) => {
    const s = subsidyBreakdown({ kw, stateSlug });
    const c = systemCost(kw, stateSlug);
    return {
      size: `${kw} kW`,
      central: rupees(s.central),
      topUp: s.stateCapital > 0 ? rupees(s.stateCapital) : "—",
      total: rupees(s.total),
      cost: rupees(c.gross),
      net: rupees(netCost(kw, s.total, stateSlug)),
    };
  });

  const city = primaryCityOf(state);
  const discom = resolveDiscom({ discomId: city?.discomId, stateSlug });
  const bill = discom ? computeBill(EXAMPLE_UNITS, discom).total : 0;
  const gen = estimateGeneration({ kw: EXAMPLE_KW, citySlug: city?.slug, stateSlug });
  const net = netCost(EXAMPLE_KW, total, stateSlug);
  const savings = estimateSavings({
    kw: EXAMPLE_KW,
    stateSlug,
    citySlug: city?.slug,
    discomId: discom?.id,
    monthlyUnits: EXAMPLE_UNITS,
    netCost: net,
  });

  // The headline names the money, because that is the query intent. But when
  // the state half is budget-dependent, the headline says "up to" rather than
  // asserting a figure the buyer may not actually receive.
  const provisional = needsAvailabilityCheck(topUp) && example.stateCapital > 0;
  const titleTail = agency && example.stateCapital > 0 ? ` (Central + ${shortAgency(agency)})` : " (PM Surya Ghar)";
  const amountPhrase = provisional ? `up to ${rupees(total)}` : rupees(total);
  const h1 = `Solar subsidy in ${state.name} ${YEAR}: ${amountPhrase} on a ${EXAMPLE_KW} kW system${titleTail}`;

  return {
    state,
    title: `Solar Subsidy in ${state.name} ${YEAR}: ${provisional ? "Up to " : ""}${rupees(total)} Total${titleTail}`,
    h1,
    description: `Exact PM Surya Ghar subsidy for ${state.name} in ${YEAR}: ${rupees(example.central)} central${
      example.stateCapital > 0 ? ` plus ${rupees(example.stateCapital)} from ${agency}` : ""
    } on a ${EXAMPLE_KW} kW rooftop system, what the system costs, and what you pay after subsidy.`,
    lede:
      example.stateCapital > 0
        ? provisional
          ? `The central subsidy of ${rupees(example.central)} is a firm entitlement. ${agency} nominally adds ${rupees(example.stateCapital)} on top, but that part is budget-dependent and has changed before — treat it as a bonus to confirm, not money to bank on.`
          : `${state.name} adds ${rupees(example.stateCapital)} on top of the central subsidy${
              topUp?.separateApplication ? `, but only if you apply to ${agency} separately` : ", credited automatically after the central payout"
            }.`
        : `${state.name} has no published state top-up, so your subsidy is the central PM Surya Ghar amount — up to ${rupees(RESIDENTIAL_CFA_CAP)}. Anyone quoting you more than that for a residential system is adding something the scheme does not.`,
    total,
    rows,
    worked: {
      kw: EXAMPLE_KW,
      discomName: discom?.name ?? "your DISCOM",
      units: EXAMPLE_UNITS,
      bill,
      kwhPerKwp: gen.kwhPerKwpYear,
      annualKwh: gen.annualKwh,
      monthlySaving: savings.year1MonthlySaving,
      monthlyBillSaving: Math.round(savings.year1BillSaving / 12),
      monthlyExportIncome: Math.round(savings.year1ExportIncome / 12),
      payback: formatYears(savings.paybackYears),
      lifetime: rupeesShort(savings.lifetimeSaving),
      net,
      emi: emi(Math.min(net, 200000), 7.15, 10),
    },
    faqs: stateFaqs(state, {
      total,
      central: example.central,
      topUp: example.stateCapital,
      agency,
      net,
      savings: savings.year1MonthlySaving,
      billSaving: Math.round(savings.year1BillSaving / 12),
    }),
    lastVerified: topUp?.lastVerified ?? "2026-09-08",
    confidence: topUp?.confidence ?? "approximate",
    provisionalTopUp: provisional,
  };
}

function shortAgency(agency: string): string {
  return agency.split(" (")[0].split(" —")[0];
}

function primaryCityOf(state: State): City | undefined {
  return citiesInState(state.slug)[0];
}

function stateFaqs(
  state: State,
  n: { total: number; central: number; topUp: number; agency: string | null; net: number; savings: number; billSaving: number },
): { q: string; a: string }[] {
  const rule = getNetMeteringRule(state.slug);
  const topUp = getStateTopUp(state.slug);

  const faqs: { q: string; a: string }[] = [
    {
      q: `How much solar subsidy do I get in ${state.name}?`,
      a:
        n.topUp > 0
          ? `On a ${EXAMPLE_KW} kW residential system the central PM Surya Ghar scheme pays ${rupees(n.central)} — ${rupees(30000)} per kW for the first 2 kW and ${rupees(18000)} for the third, capped at ${rupees(RESIDENTIAL_CFA_CAP)}. ${n.agency} nominally adds ${rupees(n.topUp)} on top, taking it to ${rupees(n.total)}.${
              needsAvailabilityCheck(getStateTopUp(state.slug))
                ? ` The state half is budget-dependent rather than guaranteed, so confirm it is still open with ${n.agency} before you factor it into your decision.`
                : ""
            }`
          : `${rupees(n.total)} on a ${EXAMPLE_KW} kW system, all of it central PM Surya Ghar money: ${rupees(30000)} per kW for the first 2 kW and ${rupees(18000)} for the third kW, capped at ${rupees(RESIDENTIAL_CFA_CAP)}. ${state.name} has no published state top-up as of our last check.`,
    },
    {
      q: `Does a bigger system get a bigger subsidy in ${state.name}?`,
      a: `No. The central subsidy stops at ${rupees(RESIDENTIAL_CFA_CAP)} for any residential system above 3 kW, so a 5 kW or 10 kW system gets exactly the same central amount as a 3 kW one. Go bigger only if your consumption justifies it.`,
    },
    {
      q: `What do I actually pay for a ${EXAMPLE_KW} kW system in ${state.name}?`,
      a: `About ${rupees(n.net)} after subsidy, on an installed cost of roughly ${rupees(systemCost(EXAMPLE_KW, state.slug).gross)}. Net-meter charges of ${rupees(3000)}–${rupees(8000)} are usually extra, and an old roof may need structural work.`,
    },
  ];

  if (topUp?.separateApplication && topUp.applicationPortal) {
    faqs.push({
      q: `Do I have to apply separately for the ${state.name} state subsidy?`,
      a: `Yes. Registering on the national PM Surya Ghar portal gets you the central subsidy only. The ${n.agency} top-up needs its own application at ${topUp.applicationPortal}, and several states have a deadline measured from your commissioning date — so do it as soon as the system is live.`,
    });
  }

  if (rule?.mechanism === "net-billing") {
    faqs.push({
      q: `Is net metering available in ${state.name}?`,
      a: `${state.name} runs net billing rather than net metering for new residential rooftop connections. Units you export are bought at the wholesale APPC rate of about Rs ${primaryDiscom(state.slug)?.appcRatePerKwh ?? 3}/unit instead of being credited 1:1 against your retail tariff. That makes daytime self-consumption far more valuable than export, and it changes the payback materially.`,
    });
  } else if (rule && rule.bankingChargePerKwh > 0) {
    faqs.push({
      q: `Are there extra charges on exported units in ${state.name}?`,
      a: `Yes — ${state.name} levies a banking charge of Rs ${rule.bankingChargePerKwh}/unit on units you export and draw back later. It is a real cost, so size the system to your daytime load rather than to your total annual bill.`,
    });
  }

  if (rule?.surplusTreatment === "lapses") {
    faqs.push({
      q: `What happens to extra units in ${state.name}?`,
      a: `Unused export credits lapse at the end of the financial year in ${state.name}. An oversized system gives that generation away for nothing, so match the system to your own annual consumption.`,
    });
  }

  faqs.push({
    q: `How long does rooftop solar take to pay back in ${state.name}?`,
    a: `On our worked example — a ${EXAMPLE_KW} kW system for a household using ${EXAMPLE_UNITS} units a month — the year-one benefit is about ${rupees(n.savings)} a month, of which ${rupees(n.billSaving)} is a smaller electricity bill and the rest is payment for surplus units. Payback depends heavily on your tariff slab and on whether your state nets exports 1:1, both of which the calculator on this page applies for you.`,
  });

  return faqs;
}

// ---------------------------------------------------------------------------
// City price pages
// ---------------------------------------------------------------------------

export interface CityPricePage {
  city: City;
  state: State;
  title: string;
  h1: string;
  description: string;
  lede: string;
  rows: { size: string; range: string; typical: string; subsidy: string; net: string; annualUnits: string }[];
  generation: { kwhPerKwp: number; annualKwh: number; dailyKwh: number; peakMonth: string; troughMonth: string; troughPct: number };
  worked: {
    kw: number;
    net: number;
    bill: number;
    units: number;
    monthlySaving: number;
    monthlyBillSaving: number;
    monthlyExportIncome: number;
    payback: string;
    lifetime: string;
    recommendedKw: number;
  };
  discomName: string;
  effectiveRate: number;
  faqs: { q: string; a: string }[];
}

export function buildCityPricePage(citySlug: string): CityPricePage | null {
  const city = getCity(citySlug);
  if (!city) return null;
  const state = getState(city.stateSlug);
  if (!state) return null;

  const discom = resolveDiscom({ discomId: city.discomId, stateSlug: city.stateSlug });
  const kwhPerKwp = cityKwhPerKwp(citySlug);

  const rows = STANDARD_SIZES.map((kw) => {
    const c = systemCost(kw, city.stateSlug);
    const s = subsidyBreakdown({ kw, stateSlug: city.stateSlug });
    return {
      size: `${kw} kW`,
      range: `${rupeesShort(c.grossMin)}–${rupeesShort(c.grossMax)}`,
      typical: rupees(c.gross),
      subsidy: rupees(s.total),
      net: rupees(netCost(kw, s.total, city.stateSlug)),
      annualUnits: formatIndianNumber(kw * kwhPerKwp),
    };
  });

  const gen = estimateGeneration({ kw: EXAMPLE_KW, citySlug });
  const { peak, trough, troughShareOfPeak } = peakAndTrough(city.region);
  const bill = discom ? computeBill(EXAMPLE_UNITS, discom).total : 0;
  const total = subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug: city.stateSlug }).total;
  const net = netCost(EXAMPLE_KW, total, city.stateSlug);
  const savings = estimateSavings({
    kw: EXAMPLE_KW,
    stateSlug: city.stateSlug,
    citySlug,
    discomId: discom?.id,
    monthlyUnits: EXAMPLE_UNITS,
    netCost: net,
  });
  const rec = recommendSize({ stateSlug: city.stateSlug, citySlug, discomId: discom?.id, monthlyUnits: EXAMPLE_UNITS });

  const netFor3 = rupees(net);

  return {
    city,
    state,
    title: `Solar Panel Price in ${city.name} ${YEAR}: ${EXAMPLE_KW} kW from ${netFor3} After Subsidy`,
    h1: `Solar panel price in ${city.name} ${YEAR}`,
    description: `What rooftop solar costs in ${city.name}: ${EXAMPLE_KW} kW for about ${netFor3} after the PM Surya Ghar subsidy, with ${city.name}'s own generation figure of ${formatIndianNumber(kwhPerKwp)} kWh per kWp a year and ${discom?.name ?? "local"} tariffs.`,
    lede: `A ${EXAMPLE_KW} kW system in ${city.name} costs about ${rupees(systemCost(EXAMPLE_KW, city.stateSlug).gross)} installed and ${netFor3} after subsidy. At ${city.name}'s ${formatIndianNumber(kwhPerKwp)} kWh per kWp a year it generates roughly ${formatIndianNumber(gen.annualKwh)} units — about ${gen.dailyAverageKwh} units a day.`,
    rows,
    generation: {
      kwhPerKwp,
      annualKwh: gen.annualKwh,
      dailyKwh: gen.dailyAverageKwh,
      peakMonth: MONTH_LABELS[peak],
      troughMonth: MONTH_LABELS[trough],
      troughPct: troughShareOfPeak,
    },
    worked: {
      kw: EXAMPLE_KW,
      net,
      bill,
      units: EXAMPLE_UNITS,
      monthlySaving: savings.year1MonthlySaving,
      monthlyBillSaving: Math.round(savings.year1BillSaving / 12),
      monthlyExportIncome: Math.round(savings.year1ExportIncome / 12),
      payback: formatYears(savings.paybackYears),
      lifetime: rupeesShort(savings.lifetimeSaving),
      recommendedKw: rec.recommendedKw,
    },
    discomName: discom?.name ?? "your DISCOM",
    effectiveRate: discom ? effectiveRate(discom, EXAMPLE_UNITS) : 0,
    faqs: cityFaqs(city, state, {
      kwhPerKwp,
      net,
      savings: savings.year1MonthlySaving,
      billSaving: Math.round(savings.year1BillSaving / 12),
      exportIncome: Math.round(savings.year1ExportIncome / 12),
      discomName: discom?.name ?? "your DISCOM",
      annualKwh: gen.annualKwh,
      troughMonth: MONTH_LABELS[trough],
      troughPct: troughShareOfPeak,
    }),
  };
}

function cityFaqs(
  city: City,
  state: State,
  n: {
    kwhPerKwp: number;
    net: number;
    savings: number;
    billSaving: number;
    exportIncome: number;
    discomName: string;
    annualKwh: number;
    troughMonth: string;
    troughPct: number;
  },
): { q: string; a: string }[] {
  const rule = getNetMeteringRule(state.slug);
  return [
    {
      q: `What is the price of a ${EXAMPLE_KW} kW solar system in ${city.name}?`,
      a: `About ${rupees(systemCost(EXAMPLE_KW, state.slug).gross)} installed for an on-grid system with tier-1 panels, inclusive of GST — and roughly ${rupees(n.net)} after the PM Surya Ghar subsidy. Quotes below the range on this page usually mean lower-grade panels or a thinner mounting structure.`,
    },
    {
      q: `How many units will solar generate in ${city.name}?`,
      a: `${city.name} averages about ${formatIndianNumber(n.kwhPerKwp)} kWh per kWp a year, so a ${EXAMPLE_KW} kW system generates roughly ${formatIndianNumber(n.annualKwh)} units annually. Output is not even across the year — ${n.troughMonth} is typically the worst month at about ${n.troughPct}% of the best one.`,
    },
    {
      q: `Is rooftop solar worth it in ${city.name}?`,
      a: `On ${n.discomName}'s domestic tariff, a ${EXAMPLE_KW} kW system for a household using ${EXAMPLE_UNITS} units a month cuts the bill by about ${rupees(n.billSaving)} a month in year one${
        n.exportIncome > 0 ? `, plus roughly ${rupees(n.exportIncome)} a month paid for the surplus it exports` : ""
      }.${
        rule?.mechanism === "net-billing"
          ? ` Note that ${state.name} runs net billing, so exported units earn a wholesale rate rather than a 1:1 credit — that is why the export half is small and why payback is longer here than in net-metering states.`
          : ""
      }`,
    },
    {
      q: `How much roof do I need for solar in ${city.name}?`,
      a: `About 100 sq ft of shadow-free roof per kW, so ${EXAMPLE_KW * 100} sq ft for a ${EXAMPLE_KW} kW system. In practice you need more total roof than that — the water tank, parapet and mumty usually leave only 60-75% of a terrace usable.`,
    },
    {
      q: `Which subsidy applies in ${city.name}?`,
      a: `${city.name} is in ${state.name}, so the central PM Surya Ghar subsidy applies${
        subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug: state.slug }).stateCapital > 0
          ? ` along with the ${getStateTopUp(state.slug)?.agency} state top-up`
          : " and there is no additional state top-up"
      }. The calculator on this page works out the exact amount for your system size.`,
    },
  ];
}
