import type { GenerationEstimate, GenerationRegion } from "./types";
import { GENERATION_REGIONS } from "./tables/generation-regions";
import { CITIES, citiesInState, getCity } from "./geo";

export { GENERATION_REGIONS };

/** National residential average (spec §2.4). */
export const NATIONAL_KWH_PER_KWP = 1500;

/**
 * Environmental factors, back-derived from the spec's own headline
 * (§T13: 1 kW ≈ 1.5 t CO2/yr ≈ 25 trees/yr) at the national 1,500 kWh/kWp.
 */
export const CO2_KG_PER_KWH = 1.0;
export const TREES_PER_TONNE_CO2 = 25 / 1.5;

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const regionByKey = new Map(GENERATION_REGIONS.map((r) => [r.key, r]));

export function getRegion(key: string): GenerationRegion | undefined {
  return regionByKey.get(key);
}

/** Monthly shares for a region, normalised to sum to exactly 1. */
export function monthlyFactors(regionKey: string): number[] {
  const region = regionByKey.get(regionKey);
  const raw = region?.monthlyFactors ?? new Array(12).fill(1 / 12);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((f) => f / sum);
}

export function cityKwhPerKwp(citySlug: string): number {
  return getCity(citySlug)?.kwhPerKwpYear ?? NATIONAL_KWH_PER_KWP;
}

/** State-level figure for flows where only the state is known (T1, T2 without a city). */
export function stateKwhPerKwp(stateSlug: string): number {
  const cities = citiesInState(stateSlug);
  if (!cities.length) return NATIONAL_KWH_PER_KWP;
  return Math.round(cities.reduce((sum, c) => sum + c.kwhPerKwpYear, 0) / cities.length);
}

export function regionOfState(stateSlug: string): string {
  const cities = citiesInState(stateSlug);
  return cities[0]?.region ?? "deccan";
}

export interface GenerationInput {
  kw: number;
  citySlug?: string;
  stateSlug?: string;
  /** Overrides the lookup entirely. */
  kwhPerKwpYear?: number;
  /** Year of operation, 1-indexed, for panel degradation. */
  year?: number;
  degradationPct?: number;
}

export function estimateGeneration(input: GenerationInput): GenerationEstimate {
  const { kw, citySlug, stateSlug, year = 1, degradationPct = 0.7 } = input;

  const city = citySlug ? getCity(citySlug) : undefined;
  const kwhPerKwpYear =
    input.kwhPerKwpYear ??
    city?.kwhPerKwpYear ??
    (stateSlug ? stateKwhPerKwp(stateSlug) : NATIONAL_KWH_PER_KWP);

  const regionKey = city?.region ?? (stateSlug ? regionOfState(stateSlug) : "deccan");
  const degradation = Math.pow(1 - degradationPct / 100, Math.max(0, year - 1));

  const annualKwh = kw * kwhPerKwpYear * degradation;
  const factors = monthlyFactors(regionKey);
  const monthlyKwh = factors.map((f) => Math.round(annualKwh * f));
  const co2Tonnes = (annualKwh * CO2_KG_PER_KWH) / 1000;

  return {
    kw,
    kwhPerKwpYear,
    annualKwh: Math.round(annualKwh),
    monthlyKwh,
    dailyAverageKwh: Math.round((annualKwh / 365) * 10) / 10,
    cuf: Math.round((annualKwh / (kw * 8760)) * 10000) / 10000,
    co2AvoidedTonnesPerYear: Math.round(co2Tonnes * 100) / 100,
    treesEquivalentPerYear: Math.round(co2Tonnes * TREES_PER_TONNE_CO2),
  };
}

/** Highest and lowest generating months — the monsoon-dip line on city pages. */
export function peakAndTrough(regionKey: string): { peak: number; trough: number; troughShareOfPeak: number } {
  const factors = monthlyFactors(regionKey);
  let peak = 0;
  let trough = 0;
  factors.forEach((f, i) => {
    if (f > factors[peak]) peak = i;
    if (f < factors[trough]) trough = i;
  });
  return {
    peak,
    trough,
    troughShareOfPeak: Math.round((factors[trough] / factors[peak]) * 100),
  };
}

export const CITY_COUNT = CITIES.length;
