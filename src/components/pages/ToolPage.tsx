import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { fontClassFor } from "@/i18n/fonts";
import { DEFAULT_LOCALE, hreflangAlternates, localePath, type Locale } from "@/i18n/locales";
import { breadcrumbSchema, jsonLd, toolSchema } from "@/lib/schema";
import { ToolMount } from "@/components/tools/ToolMount";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Breadcrumbs, Container, Prose } from "@/components/ui";
import type { ToolKind } from "@/components/tools/PrefilledTool";

/**
 * One body for all four calculators in all eight locales.
 *
 * The English routes and the /[lang]/ routes both render this, so a page cannot
 * drift between languages — and the copy comes from the message catalogue
 * rather than the route file, which is what makes these pages translatable at
 * all. The previous route files hardcoded their own English h1 and lede,
 * duplicating strings the catalogue already held.
 */

export const TOOL_SLUGS = ["subsidy-calculator", "bill-to-size", "savings-payback", "loan-emi"] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

const SLUG_TO_KIND: Record<ToolSlug, { kind: ToolKind; key: "subsidy" | "size" | "savings" | "emi" }> = {
  "subsidy-calculator": { kind: "subsidy", key: "subsidy" },
  "bill-to-size": { kind: "size", key: "size" },
  "savings-payback": { kind: "savings", key: "savings" },
  "loan-emi": { kind: "emi", key: "emi" },
};

export function toolPath(slug: ToolSlug): string {
  return `/tools/${slug}`;
}

export function toolMetadata(slug: ToolSlug, lang: Locale): Metadata {
  const m = getMessages(lang);
  const { key } = SLUG_TO_KIND[slug];
  const path = toolPath(slug);
  const canonical = localePath(lang, path);

  return {
    title: m[key].title,
    description: m[key].lede,
    alternates: {
      canonical,
      // Every locale points at the whole cluster, itself included, which is
      // what Google requires for hreflang to be reciprocal.
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title: m[key].title,
      description: m[key].lede,
      locale: lang === DEFAULT_LOCALE ? "en_IN" : `${lang}_IN`,
      url: canonical,
    },
  };
}

export function ToolPage({ slug, lang }: { slug: ToolSlug; lang: Locale }) {
  const m = getMessages(lang);
  const { kind, key } = SLUG_TO_KIND[slug];
  const path = toolPath(slug);
  const canonical = localePath(lang, path);

  const trail = [
    { label: m.nav.tools, href: localePath(lang, "/") },
    { label: m[key].title },
  ];

  return (
    /*
     * `lang` sits on the content wrapper rather than <html>, because App Router
     * allows one root <html> and the English routes own it. Scoping the
     * attribute here still gives screen readers the right pronunciation for the
     * text it wraps, and hreflang carries the signal search engines use.
     *
     * The Indic webfont rides on the same wrapper, so only the script a page
     * actually needs is loaded and English pages ship no webfont at all.
     */
    <div lang={lang} className={fontClassFor(lang)}>
      <LanguageSwitcher lang={lang} />
      <Container className="py-8">
        <Breadcrumbs trail={trail} />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{m[key].title}</h1>
        <Prose>
          <p className="mt-2 max-w-2xl">{m[key].lede}</p>
        </Prose>
        <div className="mt-8">
          <ToolMount kind={kind} sourcePage={canonical} lang={lang} />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(toolSchema({ name: m[key].title, description: m[key].lede, path: canonical }))}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
      </Container>
    </div>
  );
}
