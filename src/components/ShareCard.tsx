"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { CardKind, SessionState } from "@/lib/share";
import { canShareNatively, ogImageUrl, shortLink, whatsAppLink } from "@/lib/share";
import { SITE } from "@/lib/site";
import { en } from "@/i18n/en";
import { buttonClasses } from "./ui";

/**
 * The viral loop (spec §4): what travels is a personalised result card, not a
 * link to the tool. The short link carries the sender's own numbers as its OG
 * image, so WhatsApp renders the headline figure in the preview and the
 * recipient's flow opens prefilled to the same city.
 *
 * Anti-spam discipline from the spec: one share affordance per result, nothing
 * automatic, no dark patterns.
 */
export function ShareCard({
  kind,
  value,
  value2,
  place,
  kw,
  text,
  session,
  tool,
}: {
  kind: CardKind;
  value: number;
  value2?: number;
  place: string;
  kw?: number;
  /** The line that goes into the WhatsApp message, already localised. */
  text: string;
  session: SessionState;
  tool: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = shortLink(session);
  const message = text;
  const waHref = whatsAppLink(`${text} Check yours on ${SITE.name}:`, link);

  function onShare(channel: string) {
    track("card_shared", { tool, channel, state: session.s, city: session.c, kw: session.k });
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(`${message} ${link}`);
      setCopied(true);
      onShare("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the WhatsApp button still works */
    }
  }

  async function onNativeShare() {
    try {
      await navigator.share({ text: message, url: link });
      onShare("native");
    } catch {
      /* user dismissed the sheet */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShare("whatsapp")}
          className={`${buttonClasses("whatsapp")} flex-1`}
        >
          <WhatsAppIcon />
          {en.common.shareOnWhatsApp}
        </a>
        {canShareNatively() ? (
          <button type="button" onClick={onNativeShare} className={buttonClasses("secondary")}>
            {en.common.shareResult}
          </button>
        ) : null}
        <button type="button" onClick={onCopy} className={buttonClasses("secondary")}>
          {copied ? en.common.copied : en.common.copyLink}
        </button>
      </div>

      {/* A visible preview of exactly what the recipient will see. */}
      <details className="text-xs text-[var(--fg-subtle)]">
        <summary className="cursor-pointer">Preview the card</summary>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogImageUrl({ kind, value, value2, place, kw })}
          alt={text}
          width={1200}
          height={630}
          loading="lazy"
          className="mt-2 w-full rounded-lg border border-[var(--line)]"
        />
      </details>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.47-.72-2.96-1.16-4.82-4.22-4.97-4.42-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.77-.36l.55.01c.17 0 .41-.07.63.48.24.58.8 1.98.87 2.12.07.14.12.31.02.5-.09.19-.7.94-.86 1.1-.16.16-.24.26-.1.5.15.24.66 1.09 1.42 1.77.97.86 1.63 1.12 1.87 1.24.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.6-.18 1.28Z" />
    </svg>
  );
}
