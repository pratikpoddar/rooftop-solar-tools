import type { BillBreakdown, Discom, Slab } from "./types";
import { DISCOMS, SLAB_STATES } from "./tables/discoms";

export { DISCOMS, SLAB_STATES };

/** Assumed sanctioned load when the user has not told us, for per-kW fixed charges. */
export const DEFAULT_SANCTIONED_LOAD_KW = 3;

const byId = new Map(DISCOMS.map((d) => [d.id, d]));

export function getDiscom(id: string): Discom | undefined {
  return byId.get(id);
}

export function discomsInState(stateSlug: string): Discom[] {
  return DISCOMS.filter((d) => d.stateSlug === stateSlug);
}

export function primaryDiscom(stateSlug: string): Discom | undefined {
  const list = discomsInState(stateSlug);
  return list.find((d) => d.primary) ?? list[0];
}

export function resolveDiscom(opts: { discomId?: string; stateSlug?: string }): Discom | undefined {
  if (opts.discomId) {
    const d = byId.get(opts.discomId);
    if (d) return d;
  }
  return opts.stateSlug ? primaryDiscom(opts.stateSlug) : undefined;
}

export function hasSlabTable(stateSlug: string): boolean {
  return SLAB_STATES.includes(stateSlug);
}

function slabSpan(slab: Slab): { lowerExclusive: number; upper: number } {
  return {
    lowerExclusive: slab.from === 0 ? 0 : slab.from - 1,
    upper: slab.to ?? Infinity,
  };
}

function fixedChargeFor(discom: Discom, sanctionedLoadKw: number): number {
  return discom.fixedChargePerKw ? discom.fixedCharge * sanctionedLoadKw : discom.fixedCharge;
}

/** Monthly bill for a given consumption, slab by slab. */
export function computeBill(
  units: number,
  discom: Discom,
  sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW,
): BillBreakdown {
  const u = Math.max(0, units);
  const slabUsage: BillBreakdown["slabUsage"] = [];
  let energyCharge = 0;
  let marginalRatePerUnit = discom.slabs[0]?.rate ?? 0;

  for (const slab of discom.slabs) {
    const { lowerExclusive, upper } = slabSpan(slab);
    const unitsInSlab = Math.max(0, Math.min(u, upper) - lowerExclusive);
    if (unitsInSlab <= 0) continue;
    const amount = unitsInSlab * slab.rate;
    energyCharge += amount;
    marginalRatePerUnit = slab.rate;
    slabUsage.push({ slab, units: Math.round(unitsInSlab * 100) / 100, amount: Math.round(amount * 100) / 100 });
  }

  const fixedCharge = fixedChargeFor(discom, sanctionedLoadKw);
  const duty = energyCharge * discom.electricityDutyPct;
  const total = energyCharge + fixedCharge + duty;

  return {
    units: u,
    energyCharge: Math.round(energyCharge * 100) / 100,
    fixedCharge: Math.round(fixedCharge * 100) / 100,
    duty: Math.round(duty * 100) / 100,
    total: Math.round(total),
    effectiveRatePerUnit: u > 0 ? Math.round((total / u) * 100) / 100 : 0,
    marginalRatePerUnit,
    slabUsage,
  };
}

/**
 * Inverse of `computeBill`: how many units a given monthly bill implies.
 * Used by T2 when the user knows their rupee amount but not their units.
 */
export function unitsFromBill(
  billAmount: number,
  discom: Discom,
  sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW,
): number {
  const fixedCharge = fixedChargeFor(discom, sanctionedLoadKw);
  let remaining = Math.max(0, (billAmount - fixedCharge) / (1 + discom.electricityDutyPct));
  let units = 0;

  for (const slab of discom.slabs) {
    const { lowerExclusive, upper } = slabSpan(slab);
    const capacity = upper - lowerExclusive;
    if (slab.rate === 0) {
      // Free slabs (Tamil Nadu's first 100 units) cost nothing, so a bill that
      // only covers the fixed charge is consistent with anything from 0 units to
      // the top of the free band. We credit the full band: for sizing purposes,
      // under-reading consumption is the more expensive mistake.
      units += Number.isFinite(capacity) ? capacity : 0;
      continue;
    }
    if (remaining <= 0) return Math.round(units);
    const affordable = remaining / slab.rate;
    if (affordable <= capacity) return Math.round(units + affordable);
    units += capacity;
    remaining -= capacity * slab.rate;
  }

  const lastRate = [...discom.slabs].reverse().find((s) => s.rate > 0)?.rate ?? 1;
  return Math.round(units + remaining / lastRate);
}

/**
 * Value of removing `offsetUnits` from a bill of `baselineUnits` — the honest
 * way to price self-consumption, because solar erases the most expensive slabs
 * first (spec §T8).
 */
export function offsetValue(
  baselineUnits: number,
  offsetUnits: number,
  discom: Discom,
  sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW,
): number {
  const before = computeBill(baselineUnits, discom, sanctionedLoadKw);
  const after = computeBill(Math.max(0, baselineUnits - offsetUnits), discom, sanctionedLoadKw);
  return Math.round(before.total - after.total);
}

/** Average effective rate across a typical domestic consumption, for headline copy. */
export function effectiveRate(discom: Discom, units = 250, sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW): number {
  return computeBill(units, discom, sanctionedLoadKw).effectiveRatePerUnit;
}
