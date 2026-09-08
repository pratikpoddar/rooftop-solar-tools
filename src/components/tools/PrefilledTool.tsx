"use client";

import { useSearchParams } from "next/navigation";
import { getCity, getState, primaryDiscom, resolveDiscom } from "./engine";
import { SubsidyCalculator } from "./SubsidyCalculator";
import { BillToSize } from "./BillToSize";
import { SavingsCalculator } from "./SavingsCalculator";
import { EmiCalculator } from "./EmiCalculator";

/**
 * Reads prefill out of the query string on the client.
 *
 * Doing it here rather than from `searchParams` on the server keeps every tool
 * page statically generated — which matters because the LCP budget is 1.5s on
 * 4G (spec §5) and these pages are also the embed target for the programmatic
 * SEO pages. The chain-CTA links between tools and the /r/ share links both
 * land here.
 */
export type ToolKind = "subsidy" | "size" | "savings" | "emi";

function num(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function PrefilledTool({
  kind,
  sourcePage,
  fallback,
}: {
  kind: ToolKind;
  sourcePage: string;
  fallback?: { stateSlug?: string; citySlug?: string; discomId?: string; kw?: number };
}) {
  const params = useSearchParams();

  const citySlug = params.get("city") ?? fallback?.citySlug;
  const city = citySlug ? getCity(citySlug) : undefined;
  const stateSlug = params.get("state") ?? city?.stateSlug ?? fallback?.stateSlug;
  const state = stateSlug ? getState(stateSlug) : undefined;

  const requestedDiscom = params.get("discom") ?? fallback?.discomId;
  const discom = resolveDiscom({ discomId: requestedDiscom ?? undefined, stateSlug: state?.slug });

  const initial = {
    stateSlug: state?.slug,
    citySlug: city?.slug,
    discomId: discom?.id ?? (state ? primaryDiscom(state.slug)?.id : undefined),
  };

  const kw = num(params.get("kw")) ?? fallback?.kw;
  const monthlyUnits = num(params.get("units"));
  const monthlyBill = num(params.get("bill"));

  if (kind === "subsidy") {
    return <SubsidyCalculator initial={initial} initialKw={kw ?? 3} sourcePage={sourcePage} />;
  }
  if (kind === "size") {
    return <BillToSize initial={initial} sourcePage={sourcePage} />;
  }
  if (kind === "emi") {
    return <EmiCalculator initial={{ ...initial, kw, monthlyBill }} sourcePage={sourcePage} />;
  }
  return <SavingsCalculator initial={{ ...initial, kw, monthlyUnits, monthlyBill }} sourcePage={sourcePage} />;
}
