import { RESIDENTIAL_CFA_CAP, getStateTopUp, needsAvailabilityCheck, rupees, verifiedDate } from "@/data/solar-engine";
import { en, t } from "@/i18n/en";
import { Callout } from "./ui";

/**
 * Why acting sooner is better (spec §4.5 "wave moments").
 *
 * Written to be true rather than urgent. There is no published cut-off date for
 * PM Surya Ghar, so a countdown or an "ends soon" banner would be fabricated —
 * and §12 names subsidy-data credibility as the number-one trust risk, which a
 * fake deadline would spend in exactly the place the product cannot afford it.
 *
 * What IS true and is enough: the scheme is a fixed outlay against a household
 * target, and state top-ups are budget-dependent and do pause when allocations
 * run out. So the element states the amount available today, dates it, and says
 * plainly that we are not inventing a deadline.
 */
export function SubsidyUrgency({ stateSlug, amount }: { stateSlug?: string; amount?: number }) {
  const topUp = stateSlug ? getStateTopUp(stateSlug) : null;
  const headline = amount ?? RESIDENTIAL_CFA_CAP;

  return (
    <Callout tone="warn" title={t(en.urgency.title, { amount: rupees(headline) })}>
      <p>{en.urgency.body}</p>
      {topUp && needsAvailabilityCheck(topUp) ? (
        <p>{t(en.urgency.stateBudget, { agency: topUp.agency ?? "Your state" })}</p>
      ) : null}
      <p className="text-xs text-[var(--fg-subtle)]">
        {en.urgency.honest}
        {topUp ? ` Central rates last verified ${verifiedDate(topUp.lastVerified)}.` : ""}
      </p>
    </Callout>
  );
}
