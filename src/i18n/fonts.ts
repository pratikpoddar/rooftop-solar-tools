import {
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import type { Locale } from "./locales";
import { getLocale } from "./locales";

/**
 * Self-hosted Indic webfonts (spec §7).
 *
 * next/font downloads these at build time and serves them from our own origin,
 * so there is no request to Google on page load — which matters for the 1.5s
 * LCP budget on 4G. Only the script a page actually needs is loaded: English
 * pages ship no webfont at all and keep using the system stack.
 *
 * `display: swap` so Indic text is never invisible while the face loads; a
 * brief fallback render beats a blank subsidy figure.
 */
const devanagari = Noto_Sans_Devanagari({ weight: ["400", "600", "700"], display: "swap", subsets: ["devanagari"] });
const gujarati = Noto_Sans_Gujarati({ weight: ["400", "600", "700"], display: "swap", subsets: ["gujarati"] });
const tamil = Noto_Sans_Tamil({ weight: ["400", "600", "700"], display: "swap", subsets: ["tamil"] });
const telugu = Noto_Sans_Telugu({ weight: ["400", "600", "700"], display: "swap", subsets: ["telugu"] });
const kannada = Noto_Sans_Kannada({ weight: ["400", "600", "700"], display: "swap", subsets: ["kannada"] });
const malayalam = Noto_Sans_Malayalam({ weight: ["400", "600", "700"], display: "swap", subsets: ["malayalam"] });

const BY_SCRIPT: Record<string, { className: string } | null> = {
  latin: null,
  devanagari,
  gujarati,
  tamil,
  telugu,
  kannada,
  malayalam,
};

/** The font class to put on <body> for a locale. Empty for English. */
export function fontClassFor(lang: Locale): string {
  const script = getLocale(lang)?.script ?? "latin";
  return BY_SCRIPT[script]?.className ?? "";
}
