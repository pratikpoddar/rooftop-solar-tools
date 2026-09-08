import { cityKwhPerKwp, stateKwhPerKwp } from "./generation";
import { computeBill, resolveDiscom, unitsFromBill, DEFAULT_SANCTIONED_LOAD_KW } from "./tariffs";

/** Sizes vendors actually quote, and the sizes our cost curve is anchored on. */
export const STANDARD_SIZES = [1, 2, 3, 5, 10];

/** Usable, shadow-free roof area per kW (spec §T4). */
export const SQFT_PER_KW = 100;
export const SQM_PER_KW = 10;

/** Share of a measured roof that is actually usable after tank, parapet and mumty (spec §T4). */
export const ROOF_UTILISATION = { min: 0.6, max: 0.75, default: 0.7 };

/** Share of consumption a residential system should aim to offset (spec §T2: 80-90%). */
export const TARGET_OFFSET_SHARE = 0.85;

export function roundToStandardSize(kw: number): number {
  if (kw <= 0) return STANDARD_SIZES[0];
  if (kw >= STANDARD_SIZES[STANDARD_SIZES.length - 1]) return STANDARD_SIZES[STANDARD_SIZES.length - 1];
  return STANDARD_SIZES.reduce((best, size) => (Math.abs(size - kw) < Math.abs(best - kw) ? size : best), STANDARD_SIZES[0]);
}

/** kW that fits on a measured roof, after the obstruction allowance. */
export function kwFromRoofArea(area: number, unit: "sqft" | "sqm" = "sqft", utilisation = ROOF_UTILISATION.default): number {
  const sqft = unit === "sqm" ? area * 10.7639 : area;
  return Math.round(((sqft * utilisation) / SQFT_PER_KW) * 10) / 10;
}

/** Shadow-free area a system needs, and the gross roof area that implies. */
export function roofAreaForKw(kw: number, utilisation = ROOF_UTILISATION.default) {
  const usableSqft = Math.round(kw * SQFT_PER_KW);
  return {
    usableSqft,
    usableSqm: Math.round(kw * SQM_PER_KW),
    grossSqft: Math.round(usableSqft / utilisation),
    utilisation,
  };
}

export interface SizeInput {
  stateSlug: string;
  citySlug?: string;
  discomId?: string;
  /** Either a rupee amount or a unit count; units win if both are given. */
  monthlyBill?: number;
  monthlyUnits?: number;
  sanctionedLoadKw?: number;
}

export interface SizeRecommendation {
  monthlyUnits: number;
  annualUnits: number;
  /** Unrounded size that would offset TARGET_OFFSET_SHARE of consumption. */
  idealKw: number;
  /** Nearest standard size, capped at sanctioned load. */
  recommendedKw: number;
  kwhPerKwpYear: number;
  cappedBySanctionedLoad: boolean;
  effectiveRatePerUnit: number;
  roof: ReturnType<typeof roofAreaForKw>;
  notes: string[];
}

/** T2: monthly bill (or units) → the size to actually buy. */
export function recommendSize(input: SizeInput): SizeRecommendation {
  const { stateSlug, citySlug, discomId, monthlyBill, monthlyUnits, sanctionedLoadKw = DEFAULT_SANCTIONED_LOAD_KW } = input;
  const discom = resolveDiscom({ discomId, stateSlug });
  const notes: string[] = [];

  let units = monthlyUnits ?? 0;
  if (!monthlyUnits && monthlyBill && discom) {
    units = unitsFromBill(monthlyBill, discom, sanctionedLoadKw);
    notes.push(
      `Estimated ${units} units/month from a Rs ${Math.round(monthlyBill).toLocaleString("en-IN")} bill on ${discom.name}'s domestic tariff.`,
    );
  }

  const kwhPerKwpYear = citySlug ? cityKwhPerKwp(citySlug) : stateKwhPerKwp(stateSlug);
  const annualUnits = units * 12;
  const idealKw = kwhPerKwpYear > 0 ? Math.round(((annualUnits * TARGET_OFFSET_SHARE) / kwhPerKwpYear) * 10) / 10 : 0;

  let recommendedKw = roundToStandardSize(idealKw);
  const cappedBySanctionedLoad = recommendedKw > sanctionedLoadKw;
  if (cappedBySanctionedLoad) {
    recommendedKw = roundToStandardSize(Math.min(recommendedKw, sanctionedLoadKw));
    notes.push(
      `Capped at your ${sanctionedLoadKw} kW sanctioned load. To go bigger you need a load-enhancement application with your DISCOM first.`,
    );
  }

  const bill = discom ? computeBill(units, discom, sanctionedLoadKw) : null;

  return {
    monthlyUnits: units,
    annualUnits,
    idealKw,
    recommendedKw,
    kwhPerKwpYear,
    cappedBySanctionedLoad,
    effectiveRatePerUnit: bill?.effectiveRatePerUnit ?? 0,
    roof: roofAreaForKw(recommendedKw),
    notes,
  };
}
