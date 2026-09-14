import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { rupeesShort } from "@/data/solar-engine";
import { getMessages, t } from "@/i18n";
import { DEFAULT_LOCALE, isLaunched, isLocale, type Locale } from "@/i18n/locales";
import { SITE } from "@/lib/site";

export const runtime = "edge";

/**
 * Server-rendered result cards (spec §4.1).
 *
 * Two sizes: 1200x630 for OG/link previews and 1080x1080 for WhatsApp status.
 * Everything is driven by query params so a card is cacheable at the CDN and a
 * share link never needs a database round-trip.
 */

type Kind = "subsidy" | "savings" | "emi" | "size" | "compare";

interface Params {
  kind: Kind;
  value: number;
  value2?: number;
  place: string;
  kw?: number;
  /** Payback in years — the most legible number on a savings card. */
  payback?: number;
  /** Monthly bill saving in rupees. */
  monthly?: number;
  /** Second place name, for the city-vs-city card. */
  place2?: string;
}

interface CardCopy {
  eyebrow: (p: Params, m: M) => string;
  headline: (p: Params, m: M) => string;
  /** Small line under the headline saying what the number is. */
  subhead: (p: Params, m: M) => string;
  /** Up to two supporting figures rendered as a stat row. */
  stats: (p: Params, m: M) => { value: string; label: string }[];
}

type M = ReturnType<typeof getMessages>;

/**
 * Locales whose script this renderer can actually shape.
 *
 * Satori, which renders these cards, has no Indic complex-script shaping. It
 * draws glyphs in logical order, so every pre-base vowel sign lands on the
 * wrong consonant: Devanagari बिजली comes out as "बजिली" and बिल as "बलि";
 * Tamil is worse, with கூரை rendering as "கஉரை" and செலவு as "சலெவு".
 *
 * That is misspelling, not mis-styling — and it would go on the single most
 * forwarded artefact the product has. An English card is honest and legible; a
 * Tamil card that reads as gibberish to a Tamil speaker is neither, and it
 * damages exactly the credibility the share loop runs on.
 *
 * So cards fall back to English until the renderer can shape Indic text, which
 * needs a HarfBuzz-backed pipeline rather than Satori. The localized copy below
 * is correct and stays: enabling a script is adding it to this list.
 *
 * Everything else in the share path IS localized — the WhatsApp message text is
 * plain text with no shaping involved, and the deep link reopens the calculator
 * in the sender's language. Only the image is held back.
 */
const CARD_SHAPEABLE_LOCALES: Locale[] = ["en"];

function place(p: Params, m: M): string {
  return p.kw ? t(m.card.myRooftopIn, { kw: p.kw, place: p.place }) : t(m.card.myRooftop, { place: p.place });
}

/*
 * Card copy is localized because the card IS the share unit (spec §4.1) — but
 * see CARD_SHAPEABLE_LOCALES below for why only English is switched on today.
 */
const COPY: Record<Kind, CardCopy> = {
  savings: {
    eyebrow: place,
    /*
     * Leads with the monthly saving when we have it. "Rs 2,850 a month" is the
     * sentence a person repeats to a neighbour; "Rs 18.38 lakh over 25 years"
     * is impressive and unrepeatable. The lifetime figure drops to a stat.
     */
    headline: (p) => (p.monthly ? `${rupeesShort(p.monthly)}/mo` : rupeesShort(p.value)),
    subhead: (p, m) => (p.monthly ? m.card.offMyBill : m.card.savedOver25),
    stats: (p, m) => {
      const out: { value: string; label: string }[] = [];
      if (p.payback) out.push({ value: `${p.payback} ${m.card.yrs}`, label: m.card.toPayBack });
      if (p.value2) out.push({ value: rupeesShort(p.value2), label: m.card.governmentSubsidy });
      if (p.monthly && out.length < 2) out.push({ value: rupeesShort(p.value), label: m.card.over25Years });
      return out.slice(0, 2);
    },
  },
  subsidy: {
    eyebrow: (p, m) => t(m.card.mySubsidyIn, { place: p.place }),
    headline: (p) => rupeesShort(p.value),
    subhead: (_p, m) => m.card.paidByGovernment,
    stats: (p, m) =>
      p.value2 ? [{ value: rupeesShort(p.value2), label: t(m.card.isAllItCosts, { kw: p.kw ?? 3 }) }] : [],
  },
  emi: {
    eyebrow: place,
    headline: (p) => `${rupeesShort(p.value)}/mo`,
    subhead: (_p, m) => m.card.solarLoanEmi,
    stats: (p, m) => (p.value2 ? [{ value: rupeesShort(p.value2), label: m.card.myOldBill }] : []),
  },
  size: {
    eyebrow: (p, m) => t(m.card.myRoofIn, { place: p.place }),
    headline: (p) => `${p.value} kW`,
    subhead: (_p, m) => m.card.rightSizeForBill,
    stats: (p, m) => (p.value2 ? [{ value: rupeesShort(p.value2), label: m.card.afterSubsidy }] : []),
  },
  /*
   * The comparison card carries both cities as stats rather than declaring a
   * winner in the headline — the forward value is in the argument it starts,
   * and the recipient should read their own city's number, not ours.
   */
  compare: {
    eyebrow: (p) => `${p.place} vs ${p.place2 ?? ""}`.trim(),
    headline: (_p, m) => m.card.solarPayback,
    subhead: (_p, m) => t(m.card.comparedOnSame, { kw: 3 }),
    stats: (p, m) => [
      { value: `${p.value} ${m.card.yrs}`, label: p.place },
      { value: `${p.value2 ?? "—"} ${m.card.yrs}`, label: p.place2 ?? "" },
    ],
  },
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const kindParam = q.get("kind") ?? "savings";
  const kind: Kind = kindParam in COPY ? (kindParam as Kind) : "savings";

  const p: Params = {
    kind,
    value: Number(q.get("value") ?? 0),
    value2: q.get("value2") ? Number(q.get("value2")) : undefined,
    place: (q.get("place") ?? "India").slice(0, 40),
    kw: q.get("kw") ? Number(q.get("kw")) : undefined,
    payback: q.get("payback") ? Number(q.get("payback")) : undefined,
    monthly: q.get("monthly") ? Number(q.get("monthly")) : undefined,
    place2: q.get("place2")?.slice(0, 40),
  };

  const square = q.get("size") === "sq";
  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;
  const langParam = q.get("lang") ?? "";
  const requested: Locale = isLocale(langParam) && isLaunched(langParam) ? langParam : DEFAULT_LOCALE;
  const lang = CARD_SHAPEABLE_LOCALES.includes(requested) ? requested : DEFAULT_LOCALE;
  const m = getMessages(lang);

  const copy = COPY[kind];
  const stats = copy.stats(p, m);

  return new ImageResponse(
    (
      /*
       * Satori (which renders this) has no block layout — every element with
       * more than one child needs an explicit display. So every container here
       * declares `display: flex`, and text lives in single-child leaves.
       */
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: square ? 84 : 72,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #78350f 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 44, height: 44, borderRadius: 999, background: "#fbbf24" }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: square ? 18 : 12 }}>
          <div style={{ display: "flex", fontSize: square ? 40 : 36, color: "#fcd34d", fontWeight: 600 }}>
            {copy.eyebrow(p, m)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: square ? 150 : 128,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {copy.headline(p, m)}
          </div>
          <div style={{ display: "flex", fontSize: square ? 40 : 36, color: "#e2e8f0" }}>{copy.subhead(p, m)}</div>

          {stats.length ? (
            <div style={{ display: "flex", gap: square ? 28 : 32, marginTop: square ? 14 : 10 }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderLeft: "4px solid #fbbf24",
                    paddingLeft: 18,
                  }}
                >
                  <div style={{ display: "flex", fontSize: square ? 46 : 42, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ display: "flex", fontSize: square ? 28 : 25, color: "#94a3b8" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #475569",
            paddingTop: 28,
            fontSize: square ? 32 : 28,
          }}
        >
          <div style={{ display: "flex", color: "#fbbf24", fontWeight: 700 }}>{m.card.checkYours}</div>
          <div style={{ display: "flex", color: "#94a3b8" }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
        /*
         * A card is a pure function of its query string, so it is safe to cache
         * forever — but only if the cache key includes the query string.
         *
         * Netlify's Next.js adapter defaults to an allowlist,
         * `netlify-vary: query=__nextDataReq|_rsc`, which keys on those two
         * params and ignores everything else. With `immutable` on top of that,
         * the first card ever rendered gets frozen and served for every set of
         * numbers — silently turning the share loop into one stranger's result.
         *
         * `netlify-vary: query` (no allowlist) keys on the whole query string.
         * Other hosts ignore the header, and Vercel already keys on the full URL.
         */
        "netlify-vary": "query",
      },
    },
  );
}
