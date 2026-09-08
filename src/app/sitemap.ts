import type { MetadataRoute } from "next";
import { PHASE0_CITY_PAGES, STATES, citiesByPriority } from "@/data/solar-engine";
import { absoluteUrl } from "@/lib/site";

/**
 * Phase 0 sitemap: English only. Phase 1 emits one sitemap per language with an
 * hreflang cluster across all eight (spec §5).
 */
export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...statics, ...states, ...cities];
}
