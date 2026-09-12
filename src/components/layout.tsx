"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { ENGINE_VERSION } from "@/data/solar-engine";
import { Container } from "./ui";
import { getMessages } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/locales";

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
                <Link href="/solar-subsidy" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.subsidyByState}
                </Link>
              </li>
              <li>
                <Link href="/solar-panel-price" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.priceByCity}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-[var(--accent)] hover:underline">
                  City vs city
                </Link>
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
                <Link href="/sources" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.whereNumbers}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--fg)]">{m.nav.legal}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="/privacy" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.terms}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--accent)] hover:underline">
                  {m.nav.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--fg-subtle)]">
          We are not an installer and we do not sell hardware. Estimates are based on published central and state rates,
          SERC tariff orders and MNRE generation data; your installer quote and DISCOM approval are final. We never sell
          your personal data — the only thing that happens with your details is an introduction you explicitly asked
          for, as set out in our{" "}
          <Link href="/privacy" className="underline hover:text-[var(--accent)]">
            privacy policy
          </Link>
          . Numbers engine v{ENGINE_VERSION}.
        </p>
      </Container>
    </footer>
  );
}
