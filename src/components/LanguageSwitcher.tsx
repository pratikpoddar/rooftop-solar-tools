"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, LAUNCHED_LOCALES, isLocale, localePath, type Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n";

/**
 * Language picker.
 *
 * Renders real <a> links to the same page in each locale rather than a JS
 * redirect, so the alternates are crawlable and match the hreflang cluster —
 * a switcher that only works with JavaScript hides the translations from
 * exactly the crawler they were built for.
 */
export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname() ?? "/";
  const m = getMessages(lang);

  // Strip any existing locale prefix to get the canonical path.
  const segments = pathname.split("/").filter(Boolean);
  const bare = isLocale(segments[0] ?? "") ? `/${segments.slice(1).join("/")}` : pathname;
  const canonical = bare === "/" || bare === "" ? "/" : bare.replace(/\/$/, "");

  if (LAUNCHED_LOCALES.length < 2) return null;

  return (
    <nav aria-label={m.meta.languageLabel} className="border-t border-[var(--line)] bg-[var(--bg-soft)]">
      <ul className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-3 py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li className="shrink-0 pr-1 text-xs uppercase tracking-wide text-[var(--fg-subtle)]">
          {m.meta.languageLabel}
        </li>
        {LAUNCHED_LOCALES.map((l) => {
          const active = l.code === lang;
          return (
            <li key={l.code} className="shrink-0">
              <Link
                href={localePath(l.code, canonical)}
                hrefLang={l.htmlLang}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-md px-2 py-1 ${
                  active
                    ? "bg-[var(--bg)] font-semibold text-[var(--fg)] shadow-sm"
                    : "text-[var(--fg-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--fg)]"
                }`}
              >
                {l.native}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { DEFAULT_LOCALE };
