"use client";

import { useMemo, useState } from "react";
import { CompletionPing } from "./CompletionPing";
import {
  estimateGeneration,
  kwLabel,
  needsAvailabilityCheck,
  netCost as computeNetCost,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  systemCost,
} from "./engine";
import { CityField, NextSteps, StateField, ToolFooter, ToolFrame, useLocation } from "./shared";
import type { InitialLocation } from "./shared";
import { STANDARD_SIZES } from "./engine";
import { SegmentedControl, SizeSlider, Toggle } from "../controls";
import { Callout, Card, HeroStat, LineItems, NoteList, VerifiedStamp } from "../ui";
import { ShareCard } from "../ShareCard";
import { SubsidyUrgency } from "../SubsidyUrgency";
import { t } from "@/i18n";
import { useMessages } from "@/i18n/context";
import { NATIONAL_PORTAL } from "@/lib/site";
import { makeStartTracker } from "@/lib/analytics";

const startTracking = makeStartTracker("subsidy");

/** T1 — the hero tool. Answers the single most-searched question. */
export function SubsidyCalculator({
  initial = {},
  initialKw = 3,
  sourcePage,
}: {
  initial?: InitialLocation;
  initialKw?: number;
  sourcePage: string;
}) {
  const m = useMessages();
  const loc = useLocation(initial);
  const [kw, setKw] = useState(initialKw);
  const [consumerType, setConsumerType] = useState<"individual" | "society">("individual");
  const [bpl, setBpl] = useState(false);
  const [withinCeiling, setWithinCeiling] = useState(true);

  const generation = useMemo(
    () => estimateGeneration({ kw, citySlug: loc.citySlug, stateSlug: loc.stateSlug }),
    [kw, loc.citySlug, loc.stateSlug],
  );

  const subsidy = useMemo(
    () =>
      subsidyBreakdown({
        kw,
        stateSlug: loc.stateSlug,
        consumerType,
        bpl,
        withinIncomeCeiling: withinCeiling,
        annualKwh: generation.annualKwh,
      }),
    [kw, loc.stateSlug, consumerType, bpl, withinCeiling, generation.annualKwh],
  );

  const cost = systemCost(kw, loc.stateSlug);
  const net = computeNetCost(kw, subsidy.total, loc.stateSlug);
  const topUp = subsidy.topUp;

  function onChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      startTracking({ state: loc.stateSlug });
      setter(v);
    };
  }

  const nextSteps = [
    { label: `Register and apply on the national portal, ${NATIONAL_PORTAL}`, href: NATIONAL_PORTAL },
    { label: "Pick a vendor from your DISCOM's empanelled list and get the feasibility approval." },
    ...(topUp?.separateApplication && topUp.applicationPortal
      ? [{ label: `Apply separately to ${topUp.agency} at ${topUp.applicationPortal} — the national portal will not release the state top-up`, href: topUp.applicationPortal }]
      : []),
    { label: "After commissioning and net-meter installation, submit your bank details for the subsidy DBT." },
  ];

  return (
    <div className="space-y-6">
      <ToolFrame
        title={m.subsidy.title}
        lede={m.subsidy.lede}
        inputs={
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <StateField loc={{ ...loc, setStateSlug: onChange(loc.setStateSlug) }} />
              <CityField loc={{ ...loc, setCity: onChange(loc.setCity) }} />
            </div>
            <SizeSlider label={`${m.common.systemSize}: ${kwLabel(kw)}`} value={kw} onChange={onChange(setKw)} sizes={STANDARD_SIZES} />
            <SegmentedControl
              label={m.subsidy.consumerType}
              value={consumerType}
              onChange={onChange(setConsumerType)}
              options={[
                { value: "individual", label: m.subsidy.individual },
                { value: "society", label: m.subsidy.society },
              ]}
            />
            {consumerType === "individual" && topUp?.bpl ? (
              <Toggle label={m.subsidy.bpl} hint={`${topUp.agency} pays more to BPL households on systems up to ${topUp.bpl.maxKw} kW.`} checked={bpl} onChange={onChange(setBpl)} />
            ) : null}
            {consumerType === "individual" && topUp?.incomeCeiling ? (
              <Toggle
                label={m.subsidy.withinIncomeCeiling}
                hint={`${topUp.agency} applies a ceiling of about Rs ${(topUp.incomeCeiling.minRs / 100000).toFixed(0)}-${(topUp.incomeCeiling.maxRs / 100000).toFixed(0)} lakh.`}
                checked={withinCeiling}
                onChange={onChange(setWithinCeiling)}
              />
            ) : null}
          </>
        }
        results={
          <Card tone="accent" className="space-y-5 p-4 sm:p-5">
            <HeroStat label={m.subsidy.totalSubsidy} value={rupees(subsidy.total)} sub={`for a ${kwLabel(kw)} system in ${loc.state?.name}`} />

            <LineItems
              items={[
                { label: m.subsidy.centralSubsidy, value: rupees(subsidy.central) },
                {
                  label: topUp?.agency ? `${m.subsidy.stateTopUp} — ${topUp.agency}` : m.subsidy.stateTopUp,
                  value: subsidy.stateCapital > 0 ? rupees(subsidy.stateCapital) : "—",
                  note:
                    subsidy.stateCapital === 0
                      ? m.subsidy.noTopUp
                      : needsAvailabilityCheck(topUp)
                        ? m.subsidy.checkAvailability
                        : undefined,
                  muted: subsidy.stateCapital === 0,
                },
                { label: m.subsidy.totalSubsidy, value: rupees(subsidy.total), strong: true },
                { label: m.subsidy.systemCost, value: rupees(cost.gross), note: `Range ${rupeesShort(cost.grossMin)}–${rupeesShort(cost.grossMax)} at Rs ${cost.perWatt}/W` },
                { label: m.subsidy.netCost, value: rupees(net), strong: true },
                { label: m.subsidy.effectivePerKw, value: rupees(kw > 0 ? net / kw : 0), muted: true },
              ]}
            />

            {subsidy.stateGeneration ? (
              <LineItems
                items={[
                  {
                    label: t(m.subsidy.generationIncentive, { months: subsidy.stateGeneration.months }),
                    value: `≈ ${rupees(subsidy.stateGeneration.estimatedTotal)}`,
                    note: `About Rs ${subsidy.stateGeneration.ratePerKwh}/unit on your generation. Paid monthly, not off the invoice — so it is not added to the total above.`,
                  },
                ]}
              />
            ) : null}

            {needsAvailabilityCheck(topUp) && subsidy.stateCapital > 0 ? (
              <Callout tone="warn" title={`Confirm the ${topUp?.agency ?? "state"} top-up before you count on it`}>
                <p>
                  {rupees(subsidy.stateCapital)} of the total above is a state top-up that depends on the state&apos;s
                  budget allocation rather than being a standing entitlement. It has changed terms before and can pause
                  when the allocation runs out. The central{" "}
                  {rupees(subsidy.central)} is not affected either way.
                </p>
                {topUp?.applicationPortal ? (
                  <p>
                    <a
                      href={topUp.applicationPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--accent)] underline underline-offset-2"
                    >
                      Check current availability with {topUp.agency} →
                    </a>
                  </p>
                ) : null}
              </Callout>
            ) : null}

            <div className="space-y-3 border-t border-[var(--accent-line)] pt-4">
              <NoteList notes={subsidy.notes} />
              {topUp ? <VerifiedStamp date={topUp.lastVerified} confidence={topUp.confidence} /> : null}
            </div>
          </Card>
        }
      />

      <SubsidyUrgency stateSlug={loc.stateSlug} amount={subsidy.total} />

      <NextSteps steps={nextSteps} />

      <ToolFooter
        tool="subsidy"
        stateSlug={loc.stateSlug}
        citySlug={loc.citySlug}
        kw={kw}
        sourcePage={sourcePage}
        share={
          <ShareCard
            tool="subsidy"
            kind="subsidy"
            value={subsidy.total}
            value2={net}
            place={loc.state?.name ?? "India"}
            kw={kw}
            text={t(m.subsidy.card, { amount: rupees(subsidy.total), place: loc.state?.name ?? "India" })}
            session={{ t: "subsidy", s: loc.stateSlug, c: loc.citySlug, d: loc.discomId, k: kw }}
          />
        }
      />

      <CompletionPing tool="subsidy" state={loc.stateSlug} city={loc.citySlug} kw={kw} />
    </div>
  );
}


