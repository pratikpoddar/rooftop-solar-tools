/**
 * Site-wide configuration.
 *
 * `url` is not decoration: it is the canonical tag on every page, every URL in
 * the sitemap, every OG card URL, and every wa.me share link. A wrong value
 * does not throw — it silently emits canonicals pointing at a domain that does
 * not exist and share cards that 404, which is why the fallback chain below
 * ends at a real address rather than an aspirational one.
 *
 * Resolution order is fixed at build time in `next.config.ts`, which injects
 * the result as NEXT_PUBLIC_SITE_URL so that server and client agree. Doing it
 * there rather than here matters: Next only inlines NEXT_PUBLIC_* variables
 * into the browser bundle, so reading a host variable like Netlify's `URL`
 * directly from this module would resolve on the server and come back
 * undefined in the browser, giving every share link two different answers.
 */
export const SITE = {
  name: "SuryaKhata",
  tagline: "What rooftop solar actually costs you in India",
  description:
    "Free calculators for Indian homeowners: PM Surya Ghar subsidy, system size from your bill, 25-year savings and payback, and solar loan EMI — for your state and DISCOM.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rooftopsolarindia.netlify.app",
  locale: "en_IN",
  /** Languages the site will serve. Only `en` is built in Phase 0 (spec §7). */
  languages: ["en", "hi", "mr", "gu", "ta", "te", "kn", "ml"] as const,
  defaultLanguage: "en" as const,
} as const;

/**
 * Whether search engines may index this deployment.
 *
 * Off by default, and deliberately so. The whole SEO strategy is a programmatic
 * inventory compounding authority on one domain; letting it get indexed under a
 * temporary `*.netlify.app` address means a 301 migration later, on exactly the
 * asset that takes months to build. Share cards are worse — a card dropped in a
 * WhatsApp group outlives the hosting decision.
 *
 * So indexing is a deliberate one-flag decision. Set NEXT_PUBLIC_ALLOW_INDEXING
 * to "true" once the real domain is live and NEXT_PUBLIC_SITE_URL points at it.
 */
export const INDEXING_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

export const NATIONAL_PORTAL = "https://pmsuryaghar.gov.in";
