import { en } from "./messages/en";
import { hi } from "./messages/hi";
import { mr } from "./messages/mr";
import { gu } from "./messages/gu";
import { ta } from "./messages/ta";
import { te } from "./messages/te";
import { kn } from "./messages/kn";
import { ml } from "./messages/ml";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * Widens the canonical catalogue's literal types to `string` while preserving
 * its shape. Each locale is declared `satisfies Messages`, so a missing key, a
 * typo, or a stray extra key fails `tsc` — which is the point. The alternative,
 * a runtime fallback to English, means a translated page quietly serves half
 * its text in the wrong language and nothing tells you.
 */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type Messages = DeepString<typeof en>;

const CATALOGUES: Record<Locale, Messages> = { en, hi, mr, gu, ta, te, kn, ml };

export function getMessages(lang: Locale): Messages {
  return CATALOGUES[lang] ?? CATALOGUES[DEFAULT_LOCALE];
}

/** Minimal ICU-style interpolation: t(m.subsidy.card, { amount, place }). */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

export { en };
export * from "./locales";
