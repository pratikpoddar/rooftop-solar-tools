import type { City, State } from "./types";
import { STATES } from "./tables/states";
import { CITIES } from "./tables/cities";

export { STATES, CITIES };

/** Number of programmatic city pages built in Phase 0 (spec §9). Raise to 100 in Phase 1. */
export const PHASE0_CITY_PAGES = 40;

const stateBySlug = new Map(STATES.map((s) => [s.slug, s]));
const cityBySlug = new Map(CITIES.map((c) => [c.slug, c]));

export function getState(slug: string): State | undefined {
  return stateBySlug.get(slug);
}

export function getCity(slug: string): City | undefined {
  return cityBySlug.get(slug);
}

export function citiesInState(stateSlug: string): City[] {
  return CITIES.filter((c) => c.stateSlug === stateSlug).sort((a, b) => a.priority - b.priority);
}

export function statesByPriority(): State[] {
  return [...STATES].sort((a, b) => a.priority - b.priority);
}

export function citiesByPriority(limit = CITIES.length): City[] {
  return [...CITIES].sort((a, b) => a.priority - b.priority).slice(0, limit);
}

/** The other cities we link to from a city page (spec §5: 3 nearest, approximated by same state then priority). */
export function relatedCities(city: City, count = 3): City[] {
  const sameState = citiesInState(city.stateSlug).filter((c) => c.slug !== city.slug);
  if (sameState.length >= count) return sameState.slice(0, count);
  const sameRegion = CITIES.filter(
    (c) => c.region === city.region && c.slug !== city.slug && c.stateSlug !== city.stateSlug,
  ).sort((a, b) => a.priority - b.priority);
  return [...sameState, ...sameRegion].slice(0, count);
}

/** Best-effort PIN → city, matching on the leading 3 digits. */
export function cityFromPin(pin: string): City | undefined {
  const prefix = pin.replace(/\D/g, "").slice(0, 3);
  if (prefix.length < 3) return undefined;
  return CITIES.find((c) => c.pinPrefix === prefix);
}

/** Representative city for a state — its highest-priority entry. */
export function primaryCity(stateSlug: string): City | undefined {
  return citiesInState(stateSlug)[0];
}
