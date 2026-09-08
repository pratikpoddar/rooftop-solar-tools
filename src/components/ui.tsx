import Link from "next/link";
import type { ReactNode } from "react";
import type { Confidence } from "@/data/solar-engine";
import { ESTIMATE_DISCLAIMER, verifiedDate } from "@/data/solar-engine";
import { en, t } from "@/i18n/en";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-3xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Card({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "accent";
}) {
  const tones = {
    default: "bg-[var(--bg)] border-[var(--line)]",
    soft: "bg-[var(--bg-soft)] border-[var(--line)]",
    accent: "bg-[var(--accent-bg)] border-[var(--accent-line)]",
  };
  return <div className={`rounded-xl border ${tones[tone]} ${className}`}>{children}</div>;
}

export function SectionHeading({
  children,
  as: As = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  const size = As === "h2" ? "text-lg sm:text-xl" : "text-base";
  return <As className={`${size} font-semibold tracking-tight ${className}`}>{children}</As>;
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-[var(--fg-muted)] [&_a]:font-medium [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-[var(--fg)]">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** The one big number a tool exists to produce. */
export function HeroStat({
  label,
  value,
  sub,
  tone = "accent",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "good";
}) {
  const color = tone === "good" ? "text-[var(--good)]" : "text-[var(--accent)]";
  return (
    <div className="text-center">
      <div className="text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">{label}</div>
      <div className={`nums mt-1 text-4xl font-bold tracking-tight sm:text-5xl ${color}`}>{value}</div>
      {sub ? <div className="mt-1 text-sm text-[var(--fg-muted)]">{sub}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">{label}</div>
      <div className={`nums mt-0.5 tabular-nums ${emphasis ? "text-2xl font-bold" : "text-lg font-semibold"}`}>
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-[var(--fg-subtle)]">{sub}</div> : null}
    </div>
  );
}

export function StatGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-4 ${cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>{children}</div>;
}

/** Label/value rows — the subsidy and cost breakdowns. */
export function LineItems({
  items,
}: {
  items: { label: string; value: string; note?: string; strong?: boolean; muted?: boolean }[];
}) {
  return (
    <dl className="divide-y divide-[var(--line)]">
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className={`text-sm ${it.strong ? "font-semibold text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>
            {it.label}
            {it.note ? <span className="mt-0.5 block text-xs text-[var(--fg-subtle)]">{it.note}</span> : null}
          </dt>
          <dd
            className={`nums shrink-0 text-right ${
              it.strong ? "text-lg font-bold" : it.muted ? "text-sm text-[var(--fg-subtle)]" : "font-semibold"
            }`}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Trust furniture — the spec makes these non-negotiable (§12)
// ---------------------------------------------------------------------------

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const verified = confidence === "verified";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        verified
          ? "border-[var(--line)] bg-[var(--good-bg)] text-[var(--good)]"
          : "border-[var(--accent-line)] bg-[var(--warn-bg)] text-[var(--warn)]"
      }`}
      title={
        verified
          ? "Taken from a primary government or DISCOM source."
          : "Best-effort figure pending a primary-source check. Treat as indicative."
      }
    >
      {verified ? en.common.verified : en.common.approximate}
    </span>
  );
}

/** "Last verified on <date>" — required on every surface showing a subsidy number. */
export function VerifiedStamp({
  date,
  confidence,
  className = "",
}: {
  date: string;
  confidence?: Confidence;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-center gap-2 text-xs text-[var(--fg-subtle)] ${className}`}>
      <span>{t(en.common.lastVerified, { date: verifiedDate(date) })}</span>
      {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
    </p>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return <p className={`text-xs leading-relaxed text-[var(--fg-subtle)] ${className}`}>{ESTIMATE_DISCLAIMER}</p>;
}

export function Callout({
  children,
  tone = "info",
  title,
  className = "",
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "good";
  title?: string;
  className?: string;
}) {
  const tones = {
    info: "border-[var(--line)] bg-[var(--bg-soft)]",
    warn: "border-[var(--accent-line)] bg-[var(--warn-bg)]",
    good: "border-[var(--line)] bg-[var(--good-bg)]",
  };
  return (
    <div className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]} ${className}`}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="space-y-1.5 text-[var(--fg-muted)]">{children}</div>
    </div>
  );
}

export function NoteList({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="space-y-1.5">
      {notes.map((n) => (
        <li key={n} className="flex gap-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--line-strong)]" />
          <span>{n}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** Wide tables must scroll inside their own container, never the page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[26rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-[var(--line-strong)] px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)] first:pl-0 last:pr-0 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  strong = false,
  nowrap = false,
}: {
  children: ReactNode;
  align?: "left" | "right";
  strong?: boolean;
  nowrap?: boolean;
}) {
  return (
    <td
      className={`border-b border-[var(--line)] px-2 py-2.5 first:pl-0 last:pr-0 ${
        // Numeric cells must never wrap mid-figure; the wrapper scrolls instead.
        align === "right" ? "nums whitespace-nowrap text-right" : "text-left"
      } ${nowrap ? "whitespace-nowrap" : ""} ${strong ? "font-semibold" : ""}`}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function Breadcrumbs({ trail }: { trail: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--fg-subtle)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-[var(--accent)] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--fg-muted)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function LinkList({ links, title }: { links: { href: string; label: string }[]; title: string }) {
  if (!links.length) return null;
  return (
    <section>
      <SectionHeading as="h3" className="mb-2">
        {title}
      </SectionHeading>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-block rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-sm hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClasses(variant)} ${className}`}>
      {children}
    </Link>
  );
}

export function buttonClasses(variant: "primary" | "secondary" | "whatsapp" = "primary"): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50";
  if (variant === "primary") return `${base} bg-[var(--color-sun-500)] text-ink-950 hover:bg-[var(--color-sun-400)]`;
  if (variant === "whatsapp") return `${base} bg-[#25D366] text-[#04281a] hover:brightness-105`;
  return `${base} border border-[var(--line-strong)] bg-[var(--bg)] text-[var(--fg)] hover:border-[var(--accent-line)] hover:text-[var(--accent)]`;
}
