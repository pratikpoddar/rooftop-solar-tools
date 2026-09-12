/**
 * The eight locales the product serves (spec §7).
 *
 * English lives at the root without a prefix; the rest are subpaths. That is
 * the spec's URL structure (§5), and it means the English routes stay exactly
 * where they already rank while the others are added alongside — no redirects,
 * no middleware on the request path.
 */
export const LOCALES = [
  { code: "en", english: "English", native: "English", htmlLang: "en-IN", script: "latin", launched: true },
  { code: "hi", english: "Hindi", native: "हिन्दी", htmlLang: "hi-IN", script: "devanagari", launched: true },
  { code: "mr", english: "Marathi", native: "मराठी", htmlLang: "mr-IN", script: "devanagari", launched: true },
  { code: "gu", english: "Gujarati", native: "ગુજરાતી", htmlLang: "gu-IN", script: "gujarati", launched: true },
  { code: "ta", english: "Tamil", native: "தமிழ்", htmlLang: "ta-IN", script: "tamil", launched: true },
  { code: "te", english: "Telugu", native: "తెలుగు", htmlLang: "te-IN", script: "telugu", launched: true },
  { code: "kn", english: "Kannada", native: "ಕನ್ನಡ", htmlLang: "kn-IN", script: "kannada", launched: true },
  { code: "ml", english: "Malayalam", native: "മലയാളം", htmlLang: "ml-IN", script: "malayalam", launched: true },
] as const;

/**
 * `launched` is the safety catch the type system cannot provide.
 *
 * A catalogue is type-complete the moment every key exists — but a key holding
 * English text satisfies `string` just as well as a real translation. So an
 * un-translated locale would typecheck and then serve English under an hreflang
 * claiming Tamil, which is worse than not offering Tamil at all: Google indexes
 * duplicate English on a URL that promises another language.
 *
 * Nothing routes, appears in the switcher, or enters the hreflang cluster until
 * its flag is true. Turning a language on is therefore a deliberate act that
 * follows the translation, rather than a side effect of the file existing.
 *
 * All eight catalogues are now genuinely translated, so all eight are flagged.
 * That makes them *eligible* to be served — it does not serve them. The
 * /[lang]/ route tree is still to be built, so `localePath()` and
 * `hreflangAlternates()` currently describe URLs that do not exist yet and are
 * deliberately not called from any page. Wiring the routes is the last step.
 */
export const LAUNCHED_LOCALES = LOCALES.filter((l) => l.launched);

export type Locale = (typeof LOCALES)[number]["code"];
export type LocaleMeta = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Launched locales that carry a URL prefix — everything except the default. */
export const PREFIXED_LOCALES = LAUNCHED_LOCALES.filter((l) => l.code !== DEFAULT_LOCALE).map((l) => l.code);

const byCode = new Map(LOCALES.map((l) => [l.code, l]));

export function getLocale(code: string): LocaleMeta | undefined {
  return byCode.get(code as Locale);
}

export function isLocale(code: string): code is Locale {
  return byCode.has(code as Locale);
}

/**
 * Path for a route in a given locale. English keeps the bare path so its
 * existing URLs never move; everything else is prefixed.
 */
export function localePath(lang: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/**
 * The hreflang cluster for one page: every locale plus x-default (spec §5).
 * Google needs each page to point at all its alternates, including itself.
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LAUNCHED_LOCALES) out[l.htmlLang] = localePath(l.code, path);
  out["x-default"] = localePath(DEFAULT_LOCALE, path);
  return out;
}

export function isLaunched(code: string): boolean {
  return LAUNCHED_LOCALES.some((l) => l.code === code);
}

/**
 * Google Fonts family names per script, self-hosted via next/font.
 * Latin text uses the system stack, so only Indic scripts need a webfont.
 */
export const SCRIPT_FONTS: Record<string, string | null> = {
  latin: null,
  devanagari: "Noto Sans Devanagari",
  gujarati: "Noto Sans Gujarati",
  tamil: "Noto Sans Tamil",
  telugu: "Noto Sans Telugu",
  kannada: "Noto Sans Kannada",
  malayalam: "Noto Sans Malayalam",
};

/**
 * Paths that exist in every launched locale.
 *
 * Only these get an hreflang cluster and a language switcher. The programmatic
 * state, city and comparison pages draw their headlines, ledes and FAQs from
 * `src/lib/pages.ts` and `src/lib/compare.ts`, which are still English template
 * functions — routing them per-locale would serve a Hindi chrome wrapped around
 * an English page and tell Google it was Hindi.
 *
 * Adding a path here is therefore the same kind of deliberate act as flipping
 * `launched`: it asserts the page is fully translated, not merely reachable.
 */
export const LOCALIZED_ROUTES = [
  "/tools/subsidy-calculator",
  "/tools/bill-to-size",
  "/tools/savings-payback",
  "/tools/loan-emi",
] as const;

export type LocalizedRoute = (typeof LOCALIZED_ROUTES)[number];

export function isLocalizedRoute(path: string): path is LocalizedRoute {
  return (LOCALIZED_ROUTES as readonly string[]).includes(path);
}
