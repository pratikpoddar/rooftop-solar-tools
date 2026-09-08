import type { NetMeteringRule } from "./types";
import { NET_METERING_RULES } from "./tables/net-metering";
import { primaryDiscom, resolveDiscom } from "./tariffs";

export { NET_METERING_RULES };

const byState = new Map(NET_METERING_RULES.map((r) => [r.stateSlug, r]));

export function getNetMeteringRule(stateSlug: string): NetMeteringRule | undefined {
  return byState.get(stateSlug);
}

/**
 * What one exported unit is actually worth, in Rs.
 *  - net metering: credited 1:1 against the retail tariff, minus any banking charge
 *  - net billing / gross: bought at APPC
 */
export function exportRatePerKwh(
  stateSlug: string,
  retailMarginalRate: number,
  opts: { discomId?: string } = {},
): { rate: number; basis: "retail" | "appc"; bankingCharge: number } {
  const rule = byState.get(stateSlug);
  const discom = resolveDiscom({ discomId: opts.discomId, stateSlug }) ?? primaryDiscom(stateSlug);
  const appc = discom?.appcRatePerKwh ?? 3.2;

  if (!rule || rule.mechanism === "net-metering") {
    const banking = rule?.bankingChargePerKwh ?? 0;
    return {
      rate: Math.max(0, Math.round((retailMarginalRate - banking) * 100) / 100),
      basis: "retail",
      bankingCharge: banking,
    };
  }
  return { rate: appc, basis: "appc", bankingCharge: 0 };
}

/** True when surplus beyond the household's own annual consumption is simply lost. */
export function surplusLapses(stateSlug: string): boolean {
  return byState.get(stateSlug)?.surplusTreatment === "lapses";
}
