import type { MetadataRoute } from "next";
import { PHASE0_CITY_PAGES, STATES, citiesByPriority } from "@/data/solar-engine";
import { comparisonPairs } from "@/lib/compare";
import { LOCALIZED_ROUTES, PREFIXED_LOCALES, localePath } from "@/i18n/locales";
import { CLUSTERS, allGuides } from "@/lib/guides";
import { INDEXING_ALLOWED, absoluteUrl } from "@/lib/site";

/**
 * Phase 0 sitemap: English only. Phase 1 emits one sitemap per language with an
 * hreflang cluster across all eight (spec §5).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Nothing to submit while the deployment is noindexed.
  if (!INDEXING_ALLOWED) return [];

  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/tools/subsidy-calculator"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/tools/bill-to-size"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/tools/savings-payback"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/tools/loan-emi"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/solar-subsidy"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/solar-panel-price"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/sources"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/compare"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const states: MetadataRoute.Sitemap = STATES.map((s) => ({
    url: absoluteUrl(`/solar-subsidy/${s.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: s.priority <= 10 ? 0.9 : 0.6,
  }));

  const cities: MetadataRoute.Sitemap = citiesByPriority(PHASE0_CITY_PAGES).map((c) => ({
    url: absoluteUrl(`/solar-panel-price/${c.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: c.priority <= 20 ? 0.8 : 0.6,
  }));

  const comparisons: MetadataRoute.Sitemap = comparisonPairs().map((p) => ({
    url: absoluteUrl(`/compare/${p.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Localized calculators. Only routes listed in LOCALIZED_ROUTES are emitted,
  // since those are the ones that actually exist in every launched locale.
  const localized: MetadataRoute.Sitemap = PREFIXED_LOCALES.flatMap((lang) =>
    LOCALIZED_ROUTES.map((path) => ({
      url: absoluteUrl(localePath(lang, path)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  const guideHubs: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...CLUSTERS.map((c) => ({
      url: absoluteUrl(`/guides/topic/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // Articles that defer to a programmatic page are left out: submitting a URL
  // whose canonical points elsewhere just asks Google to resolve a conflict we
  // have already resolved.
  const guides: MetadataRoute.Sitemap = allGuides()
    .filter((g) => !g.canonicalTo)
    .map((g) => ({
      url: absoluteUrl(`/guides/${g.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...statics, ...states, ...cities, ...comparisons, ...localized, ...guideHubs, ...guides];
}
