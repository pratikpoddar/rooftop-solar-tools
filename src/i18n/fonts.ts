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
 * LCP budget on 4G.
 *
 * `preload: false` is load-bearing, not a default left alone. All six faces are
 * declared in this one module, and every localized page imports it, so with
 * preloading on Next emitted a <link rel=preload> for each: a Tamil page pulled
 * 588 KB of Devanagari, Gujarati, Kannada, Malayalam and Telugu it would never
 * render, on the critical path, to show ~90 KB of Tamil. The English pages
 * preloaded one too, despite using the system stack.
 *
 * With preloading off, the @font-face unicode-range does the selection instead:
 * the browser fetches only the face whose range matches glyphs actually on the
 * page. One face per page, discovered rather than guessed, and English pages
 * fetch none.
 *
 * The cost is that the face is requested a little later, which `display: swap`
 * already covers — a brief render in the fallback stack beats half a megabyte
 * of blocking preload.
 */
const devanagari = Noto_Sans_Devanagari({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["devanagari"] });
const gujarati = Noto_Sans_Gujarati({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["gujarati"] });
const tamil = Noto_Sans_Tamil({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["tamil"] });
const telugu = Noto_Sans_Telugu({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["telugu"] });
const kannada = Noto_Sans_Kannada({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["kannada"] });
const malayalam = Noto_Sans_Malayalam({ weight: ["400", "600", "700"], display: "swap", preload: false, subsets: ["malayalam"] });

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
