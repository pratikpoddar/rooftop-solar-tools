"use client";

import { GHS_RATE_PER_KW, rupees } from "@/data/solar-engine";
import { t } from "@/i18n";
import { useMessages } from "@/i18n/context";
import { track } from "@/lib/analytics";
import { shortLink, whatsAppLink, type SessionState } from "@/lib/share";
import { SITE } from "@/lib/site";
import { Callout, buttonClasses } from "./ui";

/**
 * The society share (spec §4.3).
 *
 * One committee member forwarding this into an RWA group puts the number in
 * front of a few hundred households that all have the same roof, the same
 * DISCOM and the same tariff — which is why the spec rates one society share
 * above fifty individual ones. The message is written to be forwarded by a
 * neighbour rather than read by a stranger: it leads with the per-flat figure,
 * because that is what a resident reacts to.
 */
export function SocietyCta({
  kw,
  place,
  monthlySaving,
  session,
  tool,
}: {
  kw: number;
  place: string;
  monthlySaving: number;
  session: SessionState;
  tool: string;
}) {
  const m = useMessages();
  const link = shortLink({ ...session, t: "savings" });
  const message = t(m.society.shareText, {
    kw,
    place,
    monthly: rupees(monthlySaving),
  });
  const href = whatsAppLink(`${message} ${SITE.name}:`, link);

  return (
    <Callout tone="good" title={m.society.title}>
      <p>{t(m.society.body, { rate: rupees(GHS_RATE_PER_KW) })}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("card_shared", { tool, channel: "whatsapp-society", state: session.s, city: session.c, kw })}
        className={`${buttonClasses("whatsapp")} mt-1 w-full`}
      >
        {m.society.cta}
      </a>
    </Callout>
  );
}
