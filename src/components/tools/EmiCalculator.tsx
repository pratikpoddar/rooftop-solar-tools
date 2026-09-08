"use client";

import { useMemo, useState } from "react";
import {
  BANKS,
  COLLATERAL_FREE_CAP,
  computeBill,
  estimateSavings,
  loanSchedule,
  netCost as computeNetCost,
  rupees,
  rupeesShort,
  subsidyBreakdown,
  unitsFromBill,
} from "./engine";
import { CityField, DiscomField, StateField, ToolFooter, ToolFrame, useLocation } from "./shared";
import type { InitialLocation } from "./shared";
import { CompletionPing } from "./CompletionPing";
import { STANDARD_SIZES } from "./engine";
import { NumberInput, SegmentedControl, Select, SizeSlider } from "../controls";
import { Callout, Card, HeroStat, LineItems, SectionHeading, Stat, StatGrid, TableWrap, Td, Th, VerifiedStamp } from "../ui";
import { EmiVsSavingChart } from "../charts";
import { ShareCard } from "../ShareCard";
import { ConfidenceBadge } from "../ui";
import { en, t } from "@/i18n/en";
import { makeStartTracker } from "@/lib/analytics";

const startTracking = makeStartTracker("emi");
const TENURES = [3, 5, 7, 10];

export interface EmiInitial extends InitialLocation {
  kw?: number;
  monthlyBill?: number;
}

/** T5 — the "solar pays for itself from month one" comparison. */
export function EmiCalculator({ initial = {}, sourcePage }: { initial?: EmiInitial; sourcePage: string }) {
  const loc = useLocation(initial);
  const [kw, setKw] = useState(initial.kw ?? 3);
  const [bill, setBill] = useState<number | "">(initial.monthlyBill ?? 2500);
  const [bankId, setBankId] = useState(BANKS[0].id);
  const [tenure, setTenure] = useState(10);
  const [amountMode, setAmountMode] = useState<"auto" | "custom">("auto");
  const [customAmount, setCustomAmount] = useState<number | "">(100000);

  const subsidy = subsidyBreakdown({ kw, stateSlug: loc.stateSlug });
  const net = computeNetCost(kw, subsidy.total, loc.stateSlug);
  const autoAmount = Math.min(net, COLLATERAL_FREE_CAP);
  const principal = amountMode === "auto" ? autoAmount : customAmount === "" ? 0 : customAmount;

  const bank = BANKS.find((b) => b.id === bankId) ?? BANKS[0];
  const schedule = loanSchedule(principal, bank.ratePct, tenure);

  const monthlyUnits = useMemo(() => {
    if (!loc.discom || bill === "") return 0;
    return unitsFromBill(bill, loc.discom);
  }, [loc.discom, bill]);

  const savings = useMemo(
    () =>
      estimateSavings({
        kw,
        stateSlug: loc.stateSlug,
        citySlug: loc.citySlug,
        discomId: loc.discomId,
        monthlyUnits,
        netCost: net,
      }),
    [kw, loc.stateSlug, loc.citySlug, loc.discomId, monthlyUnits, net],
  );

  const currentBill = loc.discom ? computeBill(monthlyUnits, loc.discom).total : 0;
  const covered = savings.year1MonthlySaving >= schedule.emi;

  function onChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      startTracking({ state: loc.stateSlug });
      setter(v);
    };
  }

  return (
    <div className="space-y-6">
      <ToolFrame
        title={en.emi.title}
        lede={en.emi.lede}
        inputs={
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <StateField loc={{ ...loc, setStateSlug: onChange(loc.setStateSlug) }} />
              <CityField loc={{ ...loc, setCity: onChange(loc.setCity) }} />
            </div>
            <DiscomField loc={{ ...loc, setDiscomId: onChange(loc.setDiscomId) }} />
            <SizeSlider label={`${en.common.systemSize}: ${kw} kW`} value={kw} onChange={onChange(setKw)} sizes={STANDARD_SIZES} />
            <NumberInput label={en.common.monthlyBill} prefix="Rs" value={bill} onChange={onChange(setBill)} step={100} hint="So we can put the EMI next to what you already pay." />
            <SegmentedControl
              label={en.emi.loanAmount}
              value={amountMode}
              onChange={onChange(setAmountMode)}
              options={[
                { value: "auto", label: `Net cost (${rupeesShort(autoAmount)})` },
                { value: "custom", label: "Choose an amount" },
              ]}
            />
            {amountMode === "custom" ? (
              <NumberInput
                label="Amount to borrow"
                prefix="Rs"
                value={customAmount}
                onChange={onChange(setCustomAmount)}
                step={5000}
                max={COLLATERAL_FREE_CAP}
                hint={`Collateral-free up to ${rupees(COLLATERAL_FREE_CAP)} under the scheme. Above that, banks ask for security.`}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={en.emi.bank}
                value={bankId}
                onChange={onChange(setBankId)}
                options={BANKS.map((b) => ({ value: b.id, label: `${b.name} — ${b.ratePct}%` }))}
              />
              <Select
                label={en.emi.tenure}
                value={String(tenure)}
                onChange={(v) => onChange(setTenure)(Number(v))}
                options={TENURES.map((y) => ({ value: String(y), label: `${y} years` }))}
              />
            </div>
          </>
        }
        results={
          <Card tone="accent" className="space-y-5 p-4 sm:p-5">
            <HeroStat label={en.emi.emi} value={rupees(schedule.emi)} sub={`${bank.name} at ${bank.ratePct}% over ${tenure} years`} />

            <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--bg)] p-3">
              <SectionHeading as="h3" className="mb-2">
                {en.savings.emiVsSaving}
              </SectionHeading>
              <EmiVsSavingChart emi={schedule.emi} saving={savings.year1MonthlySaving} />
            </div>

            <StatGrid cols={3}>
              <Stat label="Your bill today" value={rupees(currentBill)} sub={en.common.perMonth} />
              <Stat label={en.emi.totalInterest} value={rupeesShort(schedule.totalInterest)} sub={`over ${tenure} years`} />
              <Stat label={en.emi.totalPayable} value={rupeesShort(schedule.totalPayable)} />
            </StatGrid>

            <Callout tone={covered ? "good" : "warn"}>
              <p>
                {covered
                  ? `Your bill saving of ${rupees(savings.year1MonthlySaving)} covers the ${rupees(schedule.emi)} EMI from month one, leaving ${rupees(savings.year1MonthlySaving - schedule.emi)} a month in your pocket while the loan runs — and the whole saving once it is paid off.`
                  : `At this tenure the EMI of ${rupees(schedule.emi)} runs ahead of the ${rupees(savings.year1MonthlySaving)} bill saving by ${rupees(schedule.emi - savings.year1MonthlySaving)} a month. Stretching the tenure or borrowing less closes the gap.`}
              </p>
            </Callout>

            <div>
              <SectionHeading as="h3" className="mb-2">
                {en.emi.bankComparison}
              </SectionHeading>
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Bank</Th>
                    <Th align="right">Rate</Th>
                    <Th align="right">EMI</Th>
                    <Th align="right">Total interest</Th>
                  </tr>
                </thead>
                <tbody>
                  {BANKS.map((b) => {
                    const s = loanSchedule(principal, b.ratePct, tenure);
                    return (
                      <tr key={b.id}>
                        <Td strong>
                          <span className="flex flex-wrap items-center gap-1.5">
                            {b.url ? (
                              <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline underline-offset-2">
                                {b.name}
                              </a>
                            ) : (
                              b.name
                            )}
                            {b.confidence === "approximate" ? <ConfidenceBadge confidence={b.confidence} /> : null}
                          </span>
                        </Td>
                        <Td align="right">{b.ratePct}%</Td>
                        <Td align="right" strong={b.id === bankId}>
                          {rupees(s.emi)}
                        </Td>
                        <Td align="right">{rupeesShort(s.totalInterest)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
              <VerifiedStamp date={BANKS[0].lastVerified} className="mt-2" />
            </div>

            <LineItems
              items={[
                { label: "System cost", value: rupees(net + subsidy.total) },
                { label: "Less subsidy", value: `− ${rupees(subsidy.total)}` },
                { label: "You finance", value: rupees(principal), strong: true },
                ...(net > COLLATERAL_FREE_CAP
                  ? [{ label: "Paid up front", value: rupees(net - COLLATERAL_FREE_CAP), note: `Above the ${rupees(COLLATERAL_FREE_CAP)} collateral-free ceiling`, muted: true }]
                  : []),
              ]}
            />
          </Card>
        }
      />

      <ToolFooter
        tool="emi"
        stateSlug={loc.stateSlug}
        citySlug={loc.citySlug}
        kw={kw}
        monthlyBill={currentBill}
        sourcePage={sourcePage}
        share={
          <ShareCard
            tool="emi"
            kind="emi"
            value={schedule.emi}
            value2={currentBill}
            place={loc.placeLabel}
            kw={kw}
            text={t(en.emi.card, { emi: rupees(schedule.emi), bill: rupees(currentBill) })}
            session={{ t: "emi", s: loc.stateSlug, c: loc.citySlug, d: loc.discomId, k: kw, b: bill === "" ? undefined : bill }}
          />
        }
      />
      <CompletionPing tool="emi" state={loc.stateSlug} city={loc.citySlug} kw={kw} />
    </div>
  );
}
