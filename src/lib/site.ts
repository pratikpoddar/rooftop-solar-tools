/** Site-wide configuration. Domain is a placeholder until the name is picked (spec §1). */
export const SITE = {
  name: "SuryaKhata",
  tagline: "What rooftop solar actually costs you in India",
  description:
    "Free calculators for Indian homeowners: PM Surya Ghar subsidy, system size from your bill, 25-year savings and payback, and solar loan EMI — for your state and DISCOM.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://suryakhata.in",
  locale: "en_IN",
  /** Languages the site will serve. Only `en` is built in Phase 0 (spec §7). */
  languages: ["en", "hi", "mr", "gu", "ta", "te", "kn", "ml"] as const,
  defaultLanguage: "en" as const,
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

export const NATIONAL_PORTAL = "https://pmsuryaghar.gov.in";
