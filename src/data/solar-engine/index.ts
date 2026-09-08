/**
 * Rooftop Solar India — Numbers Engine (spec §2).
 *
 * The single source of truth for every rupee, unit and rate on the site.
 * Tools, programmatic pages and OG share cards all import from here so that a
 * subsidy figure on a landing page and the same figure inside a calculator can
 * never drift apart.
 *
 * Bump ENGINE_VERSION whenever a table changes, so cached pages and share cards
 * can be revalidated deliberately.
 */
export const ENGINE_VERSION = "1.0.0";

/** Rendered wherever a subsidy or tariff number appears (spec §12). */
export const ESTIMATE_DISCLAIMER =
  "Estimates based on published rates; your installer quote and DISCOM approval are final.";

export * from "./types";
export * from "./geo";
export * from "./subsidy";
export * from "./cost";
export * from "./generation";
export * from "./tariffs";
export * from "./net-metering";
export * from "./loans";
export * from "./sizing";
export * from "./savings";
export * from "./format";
export { SOURCES, getSource } from "./sources";
