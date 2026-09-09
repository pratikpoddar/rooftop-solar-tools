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
  /**
   * Grievance / privacy contact. The DPDP Act requires a reachable contact for
   * data-principal requests, so the legal pages render this. Set
   * NEXT_PUBLIC_CONTACT_EMAIL to a mailbox that a person actually reads.
   */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  /** Languages the site will serve. Only `en` is built in Phase 0 (spec §7). */
  languages: ["en", "hi", "mr", "gu", "ta", "te", "kn", "ml"] as const,
  defaultLanguage: "en" as const,
} as const;

/**
 * Whether search engines may index this deployment.
 *
 * Resolved at build time in `next.config.ts`: production indexes, deploy
 * previews and branch deploys do not, and NEXT_PUBLIC_ALLOW_INDEXING overrides
 * either way. Keeping previews out matters — they serve the same content on a
 * different hostname, which would compete with the real pages.
 *
 * Standing caveat, recorded because it is a one-way door: whatever hostname is
 * live in NEXT_PUBLIC_SITE_URL when indexing is on is the hostname Google
 * learns. Moving to a real domain later is a 301 migration on the slowest asset
 * the product has, and share cards already in WhatsApp threads keep pointing at
 * the old host forever.
 */
export const INDEXING_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

export const NATIONAL_PORTAL = "https://pmsuryaghar.gov.in";
