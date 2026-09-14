import {
  COST_ANCHORS,
  PER_WATT,
  RESIDENTIAL_CFA_CAP,
  centralSubsidy,
  formatIndianNumber,
  rupeesShort,
} from "@/data/solar-engine";

/**
 * Reconciles figures written into the articles against the numbers engine.
 *
 * The articles were drafted with their own standardised cost table, and it does
 * not match the engine: they say Rs 55,000-70,000 per kW where the curve is
 * Rs 50-65/W, and they quote a flat 3-5 year payback where the engine computes
 * anything from 2.1 years in Jaipur to 11.6 in Chennai. Publishing both would
 * put two contradicting cost tables on one domain — precisely the drift the
 * single-engine design exists to prevent, and the first thing a reader who
 * checks two pages would notice.
 *
 * So the engine wins, mechanically, at build time. Each rule below is an
 * explicit, auditable substitution rather than a general attempt to parse
 * numbers out of prose: a regex narrow enough to be certain what it matches,
 * and a replacement derived from the engine. Anything not covered is left
 * untouched and reported by `findUnreconciled`, so a stale figure surfaces as a
 * failing test rather than a quiet contradiction on a live page.
 */

export interface Rule {
  id: string;
  pattern: RegExp;
  replace: () => string;
  note: string;
}

/**
 * A price band with the unit stated once: "Rs 1.5-1.95 lakh", not
 * "Rs 1.5 lakh-Rs 1.95 lakh". Naively concatenating two formatted figures reads
 * badly, and these land mid-sentence in running prose.
 */
function anchorRange(kw: number): string {
  const a = COST_ANCHORS.find((x) => x.kw === kw);
  if (!a) return "";
  const lo = rupeesShort(a.min);
  const hi = rupeesShort(a.max);
  const unit = hi.match(/ (lakh|crore)$/)?.[1];
  if (unit && lo.endsWith(` ${unit}`)) {
    return `${lo.replace(new RegExp(` ${unit}$`), "")}-${hi.replace(/^Rs /, "")}`;
  }
  return `${lo}-${hi.replace(/^Rs /, "")}`;
}

export const RULES: Rule[] = [
  {
    id: "per-kw-range",
    pattern: /Rs 55,000[-–]70,000 per kW/g,
    replace: () => `Rs ${formatIndianNumber(PER_WATT.min * 1000)}-${formatIndianNumber(PER_WATT.max * 1000)} per kW`,
    note: "Per-kW cost restated from the engine's installed-cost curve.",
  },
  {
    id: "per-kw-range-alt",
    pattern: /Rs 45,000[-–]70,000 per kW/g,
    replace: () => `Rs ${formatIndianNumber(PER_WATT.min * 1000)}-${formatIndianNumber(PER_WATT.max * 1000)} per kW`,
    note: "Per-kW cost restated from the engine's installed-cost curve.",
  },
  {
    id: "per-watt-residential",
    pattern: /Rs 40[-–]55(?: per watt|\/Wp)/g,
    replace: () => `Rs ${PER_WATT.min}-${PER_WATT.max} per watt`,
    note: "Per-watt cost restated from the engine. The source draft also contradicted itself here, quoting Rs 40-55/W alongside Rs 55,000-70,000/kW.",
  },
  {
    id: "price-1kw",
    pattern: /Rs 60,000[-–]80,000/g,
    replace: () => anchorRange(1),
    note: "1 kW price band restated from the engine's anchor table.",
  },
  {
    id: "price-2kw",
    pattern: /Rs 1\.1[-–]1\.5 lakh/g,
    replace: () => anchorRange(2),
    note: "2 kW price band restated from the engine's anchor table.",
  },
  {
    id: "price-3kw",
    pattern: /Rs 1\.65[-–]2\.1 lakh/g,
    replace: () => anchorRange(3),
    note: "3 kW price band restated from the engine's anchor table.",
  },
  {
    id: "price-5kw",
    pattern: /Rs 2\.5[-–]3\.5 lakh/g,
    replace: () => anchorRange(5),
    note: "5 kW price band restated from the engine's anchor table.",
  },
  {
    id: "price-10kw",
    pattern: /Rs 4\.5[-–]6\.5 lakh/g,
    replace: () => anchorRange(10),
    note: "10 kW price band restated from the engine's anchor table.",
  },
  {
    id: "payback-flat-band",
    pattern: /\b3[-–]5 years?\b/g,
    /*
     * The flat "3-5 years" is the claim most worth correcting. Payback is
     * dominated by the local tariff, and the spread across our own city pages
     * runs from about 2 to 12 years — the Chennai case, where free units plus
     * net billing push it past a decade, is exactly the finding the product
     * exists to surface. Collapsing that into one national band buries it.
     */
    replace: () =>
      "roughly 3-6 years in most cities, though it ranges from about 2 years to over 10 depending on your tariff and state",
    note: "Flat national payback band replaced with the engine's actual spread.",
  },
  {
    id: "subsidy-cap",
    pattern: /Rs 78,000 \(capped\)/g,
    replace: () => `${rupeesShort(RESIDENTIAL_CFA_CAP)} (capped)`,
    note: "Central subsidy cap sourced from the engine.",
  },
];

export function reconcile(markdown: string): { text: string; applied: string[] } {
  const applied: string[] = [];
  let text = markdown;
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      applied.push(rule.id);
      rule.pattern.lastIndex = 0;
      text = text.replace(rule.pattern, () => rule.replace());
    }
    rule.pattern.lastIndex = 0;
  }
  return { text, applied };
}

/**
 * Figures that must never survive into a published article. A hit means a rule
 * stopped matching — usually because the source text was edited — and that
 * belongs in the test suite rather than in a reviewer's memory.
 */
export const STALE_PATTERNS: { id: string; pattern: RegExp }[] = [
  { id: "per-kw-55-70", pattern: /Rs 55,000[-–]70,000 per kW/ },
  { id: "per-watt-40-55", pattern: /Rs 40[-–]55(?: per watt|\/Wp)/ },
  { id: "flat-3-5-payback", pattern: /\b3[-–]5 years?\b/ },
  { id: "price-3kw-old", pattern: /Rs 1\.65[-–]2\.1 lakh/ },
];

export function findUnreconciled(text: string): string[] {
  return STALE_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.id);
}

/** Subsidy figures the articles quote that the engine confirms, for the audit trail. */
export function subsidyAgreement() {
  return [1, 2, 3].map((kw) => ({
    kw,
    article: { 1: 30000, 2: 60000, 3: 78000 }[kw]!,
    engine: centralSubsidy(kw),
    agrees: centralSubsidy(kw) === { 1: 30000, 2: 60000, 3: 78000 }[kw],
  }));
}
