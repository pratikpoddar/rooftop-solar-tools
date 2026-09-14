"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { ENGINE_VERSION } from "@/data/solar-engine";
import { Container } from "./ui";
import { getMessages } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/locales";
import type { ReactNode } from "react";

const TOOL_PATHS = [
  "/tools/subsidy-calculator",
  "/tools/bill-to-size",
  "/tools/savings-payback",
  "/tools/loan-emi",
] as const;

/**
 * The chrome sits in the root layout, which has no params, so the locale is
 * read from the path instead. Without this the nav above a Tamil page renders
 * in English and links to the English calculators, quietly dropping the reader
 * out of their language.
 */
function useLang(): Locale {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

const navLinkClasses =
  "block whitespace-nowrap rounded-md px-2.5 py-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

/**
 * The nav gets its own row below the wordmark on phones.
 *
 * Sharing one 56px row with the wordmark left roughly 130px for four links at
 * 375px, so they were clipped mid-word by the overflow container with no visual
 * cue that anything was cut off. On its own row all four fit inside 375px; the
 * scroll container stays as a safety net for ~320px screens and for the longer
 * labels that translated locales will bring.
 */
export function SiteHeader() {
  const lang = useLang();
  const m = getMessages(lang);
  const tools = TOOL_PATHS.map((href, i) => ({
    href: localePath(lang, href),
    label: [m.nav.subsidy, m.nav.size, m.nav.savings, m.nav.loan][i],
  }));
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link
          href={localePath(lang, "/")}
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span aria-hidden className="size-5 shrink-0 rounded-full bg-[var(--color-sun-400)]" />
          {SITE.name}
        </Link>

        {/* From sm up there is room alongside the wordmark. */}
        <nav aria-label={m.nav.tools} className="hidden sm:block">
          <ul className="flex items-center gap-1 text-sm">
            {tools.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className={navLinkClasses}>
                  {tool.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <nav
        aria-label={m.nav.tools}
        className="border-t border-[var(--line)] sm:hidden"
      >
        {/* scrollbar-width:none keeps the row from losing height to a gutter */}
        <ul
          className="flex items-center gap-0.5 overflow-x-auto px-2 py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tools.map((tool) => (
            <li key={tool.href} className="shrink-0">
              <Link href={tool.href} className={navLinkClasses}>
                {tool.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/**
 * A footer link whose destination is only available in English.
 *
 * The label is localized so the reader knows what the link is, but the
 * destination is not translated yet — so the anchor carries hrefLang="en" and a
 * visible marker. Silently handing a Tamil reader an English page is the kind
 * of small dishonesty that costs more trust than it saves effort.
 */
function EnglishOnlyLink({ href, lang, children }: { href: string; lang: Locale; children: ReactNode }) {
  const isEnglish = lang === DEFAULT_LOCALE;
  return (
    <Link
      href={href}
      hrefLang={isEnglish ? undefined : "en"}
      className="hover:text-[var(--accent)] hover:underline"
    >
      {children}
      {isEnglish ? null : (
        <span className="ml-1 rounded border border-[var(--line)] px-1 text-[10px] uppercase tracking-wide text-[var(--fg-subtle)]">
          EN
        </span>
      )}
    </Link>
  );
}

export function SiteFooter() {
  const lang = useLang();
  const m = getMessages(lang);
  const tools = TOOL_PATHS.map((href, i) => ({
    href: localePath(lang, href),
    label: [m.nav.subsidy, m.nav.size, m.nav.savings, m.nav.loan][i],
  }));
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--bg-soft)] py-8">
      <Container className="space-y-4 text-sm text-[var(--fg-muted)]">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold text-[var(--fg)]">{m.nav.tools}</p>
            <ul className="mt-2 space-y-1.5">
              {tools.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="hover:text-[var(--accent)] hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">{m.nav.byPlace}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <EnglishOnlyLink href="/solar-subsidy" lang={lang}>
                  {m.nav.subsidyByState}
                </EnglishOnlyLink>
              </li>
              <li>
                <EnglishOnlyLink href="/solar-panel-price" lang={lang}>
                  {m.nav.priceByCity}
                </EnglishOnlyLink>
              </li>
              <li>
                <EnglishOnlyLink href="/compare" lang={lang}>
                  City vs city
                </EnglishOnlyLink>
              </li>
              <li>
                <EnglishOnlyLink href="/guides" lang={lang}>
                  Guides
                </EnglishOnlyLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">{m.nav.officialSources}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.portal}
                </a>
              </li>
              <li>
                <EnglishOnlyLink href="/sources" lang={lang}>
                  {m.nav.whereNumbers}
                </EnglishOnlyLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--fg)]">{m.nav.legal}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <EnglishOnlyLink href="/privacy" lang={lang}>
                  {m.nav.privacy}
                </EnglishOnlyLink>
              </li>
              <li>
                <EnglishOnlyLink href="/terms" lang={lang}>
                  {m.nav.terms}
                </EnglishOnlyLink>
              </li>
              <li>
                <EnglishOnlyLink href="/contact" lang={lang}>
                  {m.nav.contact}
                </EnglishOnlyLink>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--fg-subtle)]">
          {m.nav.footerDisclaimer}{" "}
          <EnglishOnlyLink href="/privacy" lang={lang}>
            {m.nav.privacy}
          </EnglishOnlyLink>
          . {m.common.estimateDisclaimer} v{ENGINE_VERSION}
        </p>
      </Container>
    </footer>
  );
}
