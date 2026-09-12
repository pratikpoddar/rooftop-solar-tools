import {
  cityKwhPerKwp,
  computeBill,
  effectiveRate,
  estimateGeneration,
  estimateSavings,
  getCity,
  getState,
  netCost,
  resolveDiscom,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  systemCost,
  years as formatYears,
  type City,
} from "@/data/solar-engine";
import { EXAMPLE_KW, EXAMPLE_UNITS } from "./pages";

/**
 * City-vs-city comparison pages.
 *
 * These exist because of how people actually forward this stuff: someone in
 * Ahmedabad sends "look how much better Surat is" to a cousin in Surat, and the
 * cousin runs their own numbers. A comparison is a more forwardable object than
 * a single city page, because it implies an argument.
 *
 * Pairs are curated rather than combinatorial — 100 cities squared is 4,950
 * pages of near-duplicate content, which is a thin-content penalty waiting to
 * happen rather than an SEO asset.
 */

/** Cross-state pairs people genuinely compare: migration routes and rivalries. */
const NOTABLE_PAIRS: [string, string][] = [
  ["mumbai", "pune"],
  ["delhi", "jaipur"],
  ["delhi", "gurugram"],
  ["bengaluru", "chennai"],
  ["bengaluru", "hyderabad"],
  ["hyderabad", "chennai"],
  ["mumbai", "ahmedabad"],
  ["mumbai", "surat"],
  ["delhi", "lucknow"],
  ["pune", "bengaluru"],
  ["chennai", "kochi"],
  ["kolkata", "patna"],
  ["jaipur", "ahmedabad"],
  ["lucknow", "kanpur"],
  ["indore", "bhopal"],
];

/** Same-state neighbours, which is what most family comparisons actually are. */
const SAME_STATE_PAIRS: [string, string][] = [
  ["ahmedabad", "surat"],
  ["ahmedabad", "rajkot"],
  ["surat", "vadodara"],
  ["mumbai", "nagpur"],
  ["mumbai", "nashik"],
  ["pune", "nagpur"],
  ["jaipur", "jodhpur"],
  ["jaipur", "kota"],
  ["jodhpur", "bikaner"],
  ["bengaluru", "mysuru"],
  ["chennai", "coimbatore"],
  ["chennai", "madurai"],
  ["lucknow", "varanasi"],
  ["lucknow", "noida"],
  ["kanpur", "agra"],
  ["hyderabad", "warangal"],
  ["kochi", "thiruvananthapuram"],
  ["indore", "gwalior"],
];

/** Canonical slug for a pair, alphabetical so each comparison has exactly one URL. */
export function pairSlug(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}

export function comparisonPairs(): { a: string; b: string; slug: string }[] {
  const seen = new Set<string>();
  const out: { a: string; b: string; slug: string }[] = [];
  for (const [x, y] of [...SAME_STATE_PAIRS, ...NOTABLE_PAIRS]) {
    if (!getCity(x) || !getCity(y) || x === y) continue;
    const slug = pairSlug(x, y);
    if (seen.has(slug)) continue;
    seen.add(slug);
    const [a, b] = [x, y].sort();
    out.push({ a, b, slug });
  }
  return out;
}

export function parsePairSlug(slug: string): { a: string; b: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (!getCity(a) || !getCity(b)) return null;
  return { a, b };
}

export interface CitySide {
  city: City;
  stateName: string;
  discomName: string;
  kwhPerKwp: number;
  annualUnits: number;
  grossCost: number;
  subsidy: number;
  net: number;
  bill: number;
  effectiveRate: number;
  monthlySaving: number;
  /** Year-1 saving net of O&M — the denominator in payback. */
  year1NetSaving: number;
  paybackYears: number;
  paybackLabel: string;
  lifetime: number;
  lifetimeLabel: string;
}

function side(citySlug: string): CitySide | null {
  const city = getCity(citySlug);
  if (!city) return null;
  const state = getState(city.stateSlug);
  if (!state) return null;

  const discom = resolveDiscom({ discomId: city.discomId, stateSlug: city.stateSlug });
  const subsidy = subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug: city.stateSlug }).total;
  const net = netCost(EXAMPLE_KW, subsidy, city.stateSlug);
  const savings = estimateSavings({
    kw: EXAMPLE_KW,
    stateSlug: city.stateSlug,
    citySlug,
    discomId: discom?.id,
    monthlyUnits: EXAMPLE_UNITS,
    netCost: net,
  });

  return {
    city,
    stateName: state.name,
    discomName: discom?.name ?? "the local DISCOM",
    kwhPerKwp: cityKwhPerKwp(citySlug),
    annualUnits: estimateGeneration({ kw: EXAMPLE_KW, citySlug }).annualKwh,
    grossCost: systemCost(EXAMPLE_KW, city.stateSlug).gross,
    subsidy,
    net,
    bill: discom ? computeBill(EXAMPLE_UNITS, discom).total : 0,
    effectiveRate: discom ? effectiveRate(discom, EXAMPLE_UNITS) : 0,
    monthlySaving: savings.year1MonthlySaving,
    year1NetSaving: savings.year1NetSaving,
    paybackYears: savings.paybackYears,
    paybackLabel: formatYears(savings.paybackYears),
    lifetime: savings.lifetimeSaving,
    lifetimeLabel: rupeesShort(savings.lifetimeSaving),
  };
}

export interface Comparison {
  a: CitySide;
  b: CitySide;
  slug: string;
  /** The city that pays back sooner. */
  winner: CitySide;
  loser: CitySide;
  title: string;
  h1: string;
  description: string;
  /** One sentence naming which is better and, more usefully, why. */
  verdict: string;
}

/**
 * Why one city pays back sooner, established by counterfactual rather than by
 * a priority order.
 *
 * Three things could explain the gap — subsidy, sunlight, tariff — and picking
 * whichever is checked first produces confident, wrong explanations. Jaipur
 * beats Ahmedabad on all three at once, so "mostly because of the Rs 5,000
 * subsidy difference" reads as a finding while actually being an artefact of
 * check order.
 *
 * So: take the slower city and give it, one at a time, the winner's subsidy,
 * the winner's sunlight, the winner's tariff. Whichever single swap closes most
 * of the payback gap is the factor that actually drives it. Payback is
 * netCost / annualSaving, and saving moves roughly proportionally with both
 * generation and the per-unit value, which is first-order but more than good
 * enough to rank three causes.
 */
function attribute(winner: CitySide, loser: CitySide): string {
  const gap = loser.paybackYears - winner.paybackYears;
  if (!Number.isFinite(gap) || gap <= 0.15) {
    return "though the gap is small enough that your roof, your shading and your actual quote will matter more than the city";
  }

  const payback = (netCostValue: number, saving: number) => (saving > 0 ? netCostValue / saving : Infinity);
  const base = payback(loser.net, loser.year1NetSaving);

  const withWinnerSubsidy = payback(Math.max(0, loser.grossCost - winner.subsidy), loser.year1NetSaving);
  const withWinnerSun = payback(
    loser.net,
    loser.year1NetSaving * (loser.kwhPerKwp > 0 ? winner.kwhPerKwp / loser.kwhPerKwp : 1),
  );
  const withWinnerTariff = payback(
    loser.net,
    loser.year1NetSaving * (loser.effectiveRate > 0 ? winner.effectiveRate / loser.effectiveRate : 1),
  );

  const candidates = [
    {
      closed: base - withWinnerSubsidy,
      text: `mostly because ${winner.stateName} puts ${rupees(Math.abs(winner.subsidy - loser.subsidy))} more subsidy on the same ${EXAMPLE_KW} kW system`,
      valid: Math.abs(winner.subsidy - loser.subsidy) >= 1000,
    },
    {
      closed: base - withWinnerSun,
      text: `mostly because the same panels there generate about ${Math.abs(Math.round(winner.kwhPerKwp - loser.kwhPerKwp))} kWh per kWp more each year`,
      valid: Math.abs(winner.kwhPerKwp - loser.kwhPerKwp) >= 40,
    },
    {
      closed: base - withWinnerTariff,
      text: `mostly because grid electricity costs more there, about Rs ${winner.effectiveRate} a unit against Rs ${loser.effectiveRate}, so every unit the roof replaces is worth more`,
      valid: Math.abs(winner.effectiveRate - loser.effectiveRate) >= 0.4,
    },
  ].filter((c) => c.valid && c.closed > 0);

  if (!candidates.length) {
    return "and the reasons are spread across sunlight, tariff and subsidy rather than any one of them";
  }

  candidates.sort((x, y) => y.closed - x.closed);
  const [top, second] = candidates;

  // When two causes are within a third of each other, say so rather than
  // crowning one of them.
  if (second && second.closed > top.closed * 0.66) {
    return `because of a combination of factors — ${top.text.replace(/^mostly because /, "")}, and ${second.text.replace(/^mostly because /, "")}`;
  }
  return top.text;
}

export function buildComparison(aSlug: string, bSlug: string): Comparison | null {
  const a = side(aSlug);
  const b = side(bSlug);
  if (!a || !b) return null;

  const winner = a.paybackYears <= b.paybackYears ? a : b;
  const loser = winner === a ? b : a;

  const because = attribute(winner, loser);

  const title = `${a.city.name} vs ${b.city.name}: Rooftop Solar Compared`;

  return {
    a,
    b,
    slug: pairSlug(aSlug, bSlug),
    winner,
    loser,
    title,
    h1: `${a.city.name} vs ${b.city.name}: which is better for rooftop solar?`,
    description: `Side-by-side ${EXAMPLE_KW} kW rooftop solar in ${a.city.name} and ${b.city.name} — subsidy, cost after subsidy, units generated, tariff and payback. ${winner.city.name} pays back in ${winner.paybackLabel}.`,
    verdict: `On a ${EXAMPLE_KW} kW system for a household using ${EXAMPLE_UNITS} units a month, ${winner.city.name} pays back in ${winner.paybackLabel} against ${loser.paybackLabel} in ${loser.city.name} — ${because}.`,
  };
}
