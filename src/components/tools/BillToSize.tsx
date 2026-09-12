"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SANCTIONED_LOAD_KW,
  computeBill,
  formatIndianNumber,
  kwLabel,
  netCost as computeNetCost,
  recommendSize,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  systemCost,
} from "./engine";
import { CityField, DiscomField, StateField, ToolFooter, ToolFrame, useLocation } from "./shared";
import type { InitialLocation } from "./shared";
import { CompletionPing } from "./CompletionPing";
import { NumberInput, SegmentedControl, Select } from "../controls";
import { Card, Callout, HeroStat, LineItems, NoteList, Stat, StatGrid } from "../ui";
import { ShareCard } from "../ShareCard";
import { ButtonLink } from "../ui";
import { t } from "@/i18n";
import { useMessages } from "@/i18n/context";
import { makeStartTracker } from "@/lib/analytics";

const startTracking = makeStartTracker("size");
const SANCTIONED_LOADS = [1, 2, 3, 5, 7, 10];

/** T2 — turns the one number every homeowner knows (their bill) into a size. */
export function BillToSize({
  initial = {},
  sourcePage,
}: {
  initial?: InitialLocation;
  sourcePage: string;
}) {
  const m = useMessages();
  const loc = useLocation(initial);
  const [mode, setMode] = useState<"bill" | "units">("bill");
  const [bill, setBill] = useState<number | "">(2500);
  const [units, setUnits] = useState<number | "">(300);
  const [sanctionedLoad, setSanctionedLoad] = useState(DEFAULT_SANCTIONED_LOAD_KW);

  const billValue = bill === "" ? 0 : bill;
  const unitsValue = units === "" ? 0 : units;

  const rec = useMemo(
    () =>
      recommendSize({
        stateSlug: loc.stateSlug,
        citySlug: loc.citySlug,
        discomId: loc.discomId,
        monthlyBill: mode === "bill" ? billValue : undefined,
        monthlyUnits: mode === "units" ? unitsValue : undefined,
        sanctionedLoadKw: sanctionedLoad,
      }),
    [loc.stateSlug, loc.citySlug, loc.discomId, mode, billValue, unitsValue, sanctionedLoad],
  );

  const kw = rec.recommendedKw;
  const subsidy = subsidyBreakdown({ kw, stateSlug: loc.stateSlug });
  const cost = systemCost(kw, loc.stateSlug);
  const net = computeNetCost(kw, subsidy.total, loc.stateSlug);
  const monthlyBillForLead = loc.discom ? computeBill(rec.monthlyUnits, loc.discom, sanctionedLoad).total : billValue;
  const offsetPct =
    rec.annualUnits > 0 ? Math.min(100, Math.round(((kw * rec.kwhPerKwpYear) / rec.annualUnits) * 100)) : 0;

  function onChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      startTracking({ state: loc.stateSlug, city: loc.citySlug });
      setter(v);
    };
  }

  const savingsHref = `/tools/savings-payback?state=${loc.stateSlug}&city=${loc.citySlug}&discom=${loc.discomId}&kw=${kw}&units=${rec.monthlyUnits}`;

  return (
    <div className="space-y-6">
      <ToolFrame
        title={m.size.title}
        lede={m.size.lede}
        inputs={
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <StateField loc={{ ...loc, setStateSlug: onChange(loc.setStateSlug) }} />
              <CityField loc={{ ...loc, setCity: onChange(loc.setCity) }} />
            </div>
            <DiscomField loc={{ ...loc, setDiscomId: onChange(loc.setDiscomId) }} />
            <SegmentedControl
              label={m.common.whatDoYouKnow}
              value={mode}
              onChange={onChange(setMode)}
              options={[
                { value: "bill", label: m.common.myBillAmount },
                { value: "units", label: m.common.myUnits },
              ]}
            />
            {mode === "bill" ? (
              <NumberInput
                label={m.common.monthlyBill}
                prefix="Rs"
                value={bill}
                onChange={onChange(setBill)}
                step={100}
                hint={m.size.billHint}
              />
            ) : (
              <NumberInput
                label={m.common.monthlyUnits}
                suffix="kWh"
                value={units}
                onChange={onChange(setUnits)}
                step={10}
                hint={m.size.unitsHint}
              />
            )}
            <Select
              label={m.common.sanctionedLoad}
              hint={m.size.loadHint}
              value={String(sanctionedLoad)}
              onChange={(v) => onChange(setSanctionedLoad)(Number(v))}
              options={SANCTIONED_LOADS.map((l) => ({ value: String(l), label: `${l} kW` }))}
            />
          </>
        }
        results={
          <Card tone="accent" className="space-y-5 p-4 sm:p-5">
            <HeroStat
              label={m.size.recommended}
              value={kwLabel(kw)}
              sub={t(m.size.offsetShare, { pct: offsetPct })}
            />

            <StatGrid cols={3}>
              <Stat
                label={m.size.yourUsage}
                value={`${formatIndianNumber(rec.monthlyUnits)} ${m.common.unitsPerMonth}`}
                sub={m.common.perMonth}
              />
              <Stat label={m.size.roofNeeded} value={`${formatIndianNumber(rec.roof.usableSqft)} sq ft`} sub="shadow-free" />
              <Stat label={m.size.idealSize} value={kwLabel(rec.idealKw)} sub="before rounding" />
            </StatGrid>

            <LineItems
              items={[
                { label: m.subsidy.systemCost, value: rupees(cost.gross), note: `Range ${rupeesShort(cost.grossMin)}–${rupeesShort(cost.grossMax)}` },
                { label: m.subsidy.totalSubsidy, value: `− ${rupees(subsidy.total)}` },
                { label: m.subsidy.netCost, value: rupees(net), strong: true },
              ]}
            />

            <Callout>
              <p>
                <strong>{formatIndianNumber(rec.roof.grossSqft)} sq ft</strong> of total roof usually yields the{" "}
                {formatIndianNumber(rec.roof.usableSqft)} sq ft this system needs, once the water tank, parapet and mumty
                are out of the way.
              </p>
            </Callout>

            {rec.notes.length ? (
              <div className="border-t border-[var(--accent-line)] pt-4">
                <NoteList notes={rec.notes} />
              </div>
            ) : null}

            <ButtonLink href={savingsHref} variant="secondary" className="w-full">
              See 25-year savings for this {kwLabel(kw)} system →
            </ButtonLink>
          </Card>
        }
      />

      <ToolFooter
        tool="size"
        stateSlug={loc.stateSlug}
        citySlug={loc.citySlug}
        kw={kw}
        monthlyBill={monthlyBillForLead}
        sourcePage={sourcePage}
        share={
          <ShareCard
            tool="size"
            kind="size"
            value={kw}
            value2={net}
            place={loc.placeLabel}
            kw={kw}
            text={t(m.size.card, { kw: String(kw), place: loc.placeLabel })}
            session={{ t: "size", s: loc.stateSlug, c: loc.citySlug, d: loc.discomId, u: rec.monthlyUnits }}
          />
        }
      />
      <CompletionPing tool="size" state={loc.stateSlug} city={loc.citySlug} kw={kw} />
    </div>
  );
}
