"use client";

import { track } from "@/lib/analytics";
import { absoluteUrl, SITE } from "@/lib/site";
import { ogImageUrl, whatsAppLink } from "@/lib/share";
import { Callout, SectionHeading, buttonClasses } from "./ui";

/**
 * Share affordance for a comparison.
 *
 * The message is written as the thing a person is already about to say — "our
 * city is better than yours" — because that is what gets forwarded to family in
 * another city, and the recipient arrives on a page where their own city is
 * already one of the two columns.
 */
export function CompareShare({
  aName,
  bName,
  aPayback,
  bPayback,
  winner,
  winnerPayback,
  slug,
}: {
  aName: string;
  bName: string;
  aPayback: number;
  bPayback: number;
  winner: string;
  winnerPayback: string;
  slug: string;
}) {
  const link = absoluteUrl(`/compare/${slug}`);
  const text = `${aName} vs ${bName} for rooftop solar: ${winner} pays back in ${winnerPayback}. Check your own city on ${SITE.name}:`;
  const href = whatsAppLink(text, link);

  return (
    <section className="mt-8 space-y-3">
      <SectionHeading as="h3">Send this to someone in the other city</SectionHeading>
      <Callout>
        <p>
          Comparisons travel further than single-city pages — people forward them to family somewhere else, and the
          recipient lands on a page where their own city is already one of the columns.
        </p>
      </Callout>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("card_shared", { tool: "compare", channel: "whatsapp", city: slug })}
        className={`${buttonClasses("whatsapp")} w-full`}
      >
        Share this comparison on WhatsApp
      </a>
      <details className="text-xs text-[var(--fg-subtle)]">
        <summary className="cursor-pointer">Preview the card</summary>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogImageUrl({
            kind: "compare",
            value: aPayback,
            value2: bPayback,
            place: aName,
            place2: bName,
          })}
          alt={`${aName} versus ${bName} solar payback`}
          width={1200}
          height={630}
          loading="lazy"
          className="mt-2 w-full rounded-lg border border-[var(--line)]"
        />
      </details>
    </section>
  );
}
