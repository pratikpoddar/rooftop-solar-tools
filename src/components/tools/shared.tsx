"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ESTIMATE_DISCLAIMER,
  NATIONAL_PORTAL_FALLBACK,
  STANDARD_SIZES,
  STATES,
  citiesInState,
  discomsInState,
  getCity,
  getState,
  primaryDiscom,
  resolveDiscom,
} from "./engine";
import { en } from "@/i18n/en";
import { Select } from "../controls";
import { ButtonLink, Callout, Card, Disclaimer, SectionHeading } from "../ui";
import { LeadForm } from "../LeadForm";

export { STANDARD_SIZES, NATIONAL_PORTAL_FALLBACK };

export interface InitialLocation {
  stateSlug?: string;
  citySlug?: string;
  discomId?: string;
}

/**
 * State / city / DISCOM selection, shared by every tool so the three stay
 * consistent: changing the state resets the city and DISCOM to that state's
 * defaults rather than leaving a mismatched pair behind.
 */
export function useLocation(initial: InitialLocation = {}) {
  const [stateSlug, setStateSlugRaw] = useState(initial.stateSlug ?? "gujarat");
  const [citySlug, setCitySlug] = useState<string>(
    initial.citySlug ?? citiesInState(initial.stateSlug ?? "gujarat")[0]?.slug ?? "",
  );
  const [discomId, setDiscomId] = useState<string>(
    initial.discomId ??
      getCity(initial.citySlug ?? "")?.discomId ??
      primaryDiscom(initial.stateSlug ?? "gujarat")?.id ??
      "",
  );

  function setStateSlug(next: string) {
    setStateSlugRaw(next);
    const city = citiesInState(next)[0];
    setCitySlug(city?.slug ?? "");
    setDiscomId(city?.discomId ?? primaryDiscom(next)?.id ?? "");
  }

  function setCity(next: string) {
    setCitySlug(next);
    const city = getCity(next);
    if (city?.discomId) setDiscomId(city.discomId);
  }

  const cities = useMemo(() => citiesInState(stateSlug), [stateSlug]);
  const discoms = useMemo(() => discomsInState(stateSlug), [stateSlug]);
  const discom = resolveDiscom({ discomId, stateSlug });
  const state = getState(stateSlug);
  const city = citySlug ? getCity(citySlug) : undefined;

  return {
    stateSlug,
    setStateSlug,
    citySlug,
    setCity,
    discomId,
    setDiscomId,
    cities,
    discoms,
    discom,
    state,
    city,
    placeLabel: city?.name ?? state?.name ?? "India",
  };
}

export type LocationModel = ReturnType<typeof useLocation>;

export function StateField({ loc }: { loc: LocationModel }) {
  return (
    <Select
      label={en.common.state}
      value={loc.stateSlug}
      onChange={loc.setStateSlug}
      options={STATES.map((s) => ({ value: s.slug, label: s.name }))}
    />
  );
}

export function CityField({ loc }: { loc: LocationModel }) {
  if (!loc.cities.length) return null;
  return (
    <Select
      label={en.common.city}
      value={loc.citySlug}
      onChange={loc.setCity}
      options={loc.cities.map((c) => ({ value: c.slug, label: c.name }))}
    />
  );
}

export function DiscomField({ loc }: { loc: LocationModel }) {
  if (loc.discoms.length < 2) return null;
  return (
    <Select
      label={en.common.discom}
      value={loc.discomId}
      onChange={loc.setDiscomId}
      options={loc.discoms.map((d) => ({ value: d.id, label: d.name }))}
    />
  );
}

// ---------------------------------------------------------------------------
// Tool chrome
// ---------------------------------------------------------------------------

export function ToolFrame({
  title,
  lede,
  inputs,
  results,
}: {
  title: string;
  lede: string;
  inputs: ReactNode;
  results: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <header>
        <SectionHeading>{title}</SectionHeading>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">{lede}</p>
      </header>
      <Card className="p-4 sm:p-5">
        <div className="space-y-4">{inputs}</div>
      </Card>
      {results}
    </section>
  );
}

/**
 * The two CTAs every tool ends in (spec §3), in that order: quotes first
 * because it is the monetised action, share second because it is the loop.
 */
export function ToolFooter({
  tool,
  stateSlug,
  citySlug,
  kw,
  monthlyBill,
  sourcePage,
  share,
}: {
  tool: string;
  stateSlug?: string;
  citySlug?: string;
  kw?: number;
  monthlyBill?: number;
  sourcePage: string;
  share: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <SectionHeading as="h3">{en.common.shareResult}</SectionHeading>
        {share}
      </div>
      <LeadForm
        tool={tool}
        stateSlug={stateSlug}
        citySlug={citySlug}
        kw={kw}
        monthlyBill={monthlyBill}
        sourcePage={sourcePage}
      />
      <Disclaimer />
    </div>
  );
}

export function NextSteps({ steps }: { steps: { label: string; href?: string }[] }) {
  return (
    <Callout title={en.common.nextSteps}>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.label} className="flex gap-2">
            <span className="nums shrink-0 font-semibold text-[var(--fg)]">{i + 1}.</span>
            <span>
              {s.href ? (
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--accent)] underline underline-offset-2">
                  {s.label}
                </a>
              ) : (
                s.label
              )}
            </span>
          </li>
        ))}
      </ol>
    </Callout>
  );
}

export function ChainCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <ButtonLink href={href} variant="secondary" className="w-full">
      {children}
    </ButtonLink>
  );
}

export const DISCLAIMER_TEXT = ESTIMATE_DISCLAIMER;
