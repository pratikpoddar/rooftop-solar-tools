import type { CostAnchor, CostBreakdown } from "./types";

/**
 * Installed-cost curve (spec §2.3): on-grid, standard roof, tier-1 panels,
 * inclusive of GST at 12%. `default` is the figure used in every calculation.
 */
export const COST_ANCHORS: CostAnchor[] = [
  { kw: 1, min: 50000, max: 65000, default: 58000 },
  { kw: 2, min: 100000, max: 130000, default: 115000 },
  { kw: 3, min: 150000, max: 195000, default: 172000 },
  { kw: 5, min: 250000, max: 325000, default: 285000 },
  { kw: 10, min: 500000, max: 650000, default: 570000 },
];

/** Per-watt band for residential systems, Rs/W (spec §2.3). */
export const PER_WATT = { min: 50, max: 65, default: 57 };

/**
 * State cost adjustment as a fraction. Only the two values the spec quotes are
 * populated; the rest default to 0 pending the per-state pass in Phase 0.
 */
export const STATE_COST_ADJUSTMENT: Record<string, number> = {
  gujarat: -0.05,
  delhi: 0.08,
};

export const ADD_ONS = {
  netMeterCharge: { min: 3000, max: 8000, default: 5000 },
  structuralReinforcement: { min: 10000, max: 50000 },
};

export const COST_LAST_VERIFIED = "2026-09-08";

/** Piecewise-linear interpolation across the anchor table, extrapolating per-watt beyond 10 kW. */
function interpolate(kw: number, pick: (a: CostAnchor) => number, perWatt: number): number {
  if (kw <= 0) return 0;
  const anchors = COST_ANCHORS;
  if (kw <= anchors[0].kw) return Math.round((pick(anchors[0]) / anchors[0].kw) * kw);
  for (let i = 0; i < anchors.length - 1; i++) {
    const lo = anchors[i];
    const hi = anchors[i + 1];
    if (kw <= hi.kw) {
      const t = (kw - lo.kw) / (hi.kw - lo.kw);
      return Math.round(pick(lo) + t * (pick(hi) - pick(lo)));
    }
  }
  return Math.round(kw * 1000 * perWatt);
}

export function systemCost(kw: number, stateSlug?: string): CostBreakdown {
  const adjustment = (stateSlug && STATE_COST_ADJUSTMENT[stateSlug]) || 0;
  const factor = 1 + adjustment;

  const gross = Math.round(interpolate(kw, (a) => a.default, PER_WATT.default) * factor);
  const grossMin = Math.round(interpolate(kw, (a) => a.min, PER_WATT.min) * factor);
  const grossMax = Math.round(interpolate(kw, (a) => a.max, PER_WATT.max) * factor);

  return {
    kw,
    gross,
    grossMin,
    grossMax,
    perWatt: kw > 0 ? Math.round((gross / (kw * 1000)) * 10) / 10 : 0,
    stateAdjustment: adjustment,
    addOns: {
      netMeterCharge: ADD_ONS.netMeterCharge,
      structuralReinforcement: { ...ADD_ONS.structuralReinforcement, flagged: kw >= 5 },
    },
  };
}

/** Installed cost minus the capital subsidy, floored at zero. */
export function netCost(kw: number, subsidyTotal: number, stateSlug?: string): number {
  return Math.max(0, systemCost(kw, stateSlug).gross - subsidyTotal);
}
