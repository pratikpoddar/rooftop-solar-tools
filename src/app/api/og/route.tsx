import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { rupeesShort } from "@/data/solar-engine";
import { SITE } from "@/lib/site";

export const runtime = "edge";

/**
 * Server-rendered result cards (spec §4.1).
 *
 * Two sizes: 1200x630 for OG/link previews and 1080x1080 for WhatsApp status.
 * Everything is driven by query params so a card is cacheable at the CDN and a
 * share link never needs a database round-trip.
 */

type Kind = "subsidy" | "savings" | "emi" | "size";

const COPY: Record<Kind, { eyebrow: string; caption: (p: Params) => string }> = {
  subsidy: {
    eyebrow: "My solar subsidy",
    caption: (p) => (p.value2 ? `so a ${p.kw} kW system costs me ${rupeesShort(p.value2)}` : "under PM Surya Ghar"),
  },
  savings: {
    eyebrow: "My roof saves this in 25 years",
    caption: (p) => (p.value2 ? `after a ${rupeesShort(p.value2)} government subsidy` : "after the government subsidy"),
  },
  emi: {
    eyebrow: "My solar EMI",
    caption: (p) => (p.value2 ? `against an electricity bill of ${rupeesShort(p.value2)} a month` : "instead of an electricity bill"),
  },
  size: {
    eyebrow: "The system my roof needs",
    caption: (p) => (p.value2 ? `about ${rupeesShort(p.value2)} after subsidy` : "sized from my own bill"),
  },
};

interface Params {
  kind: Kind;
  value: number;
  value2?: number;
  place: string;
  kw?: number;
}

function placeLine(p: Params): string {
  return p.kw && p.kind !== "size" ? `${p.place} · ${p.kw} kW` : p.place;
}

function headline(p: Params): string {
  if (p.kind === "size") return `${p.value} kW`;
  if (p.kind === "emi") return `${rupeesShort(p.value)}/mo`;
  return rupeesShort(p.value);
}

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
  };

  const square = q.get("size") === "sq";
  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;
  const copy = COPY[kind];

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

        <div style={{ display: "flex", flexDirection: "column", gap: square ? 18 : 10 }}>
          <div style={{ display: "flex", fontSize: square ? 40 : 36, color: "#fcd34d", fontWeight: 600 }}>
            {copy.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: square ? 168 : 140,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {headline(p)}
          </div>
          <div style={{ display: "flex", fontSize: square ? 42 : 38, color: "#e2e8f0" }}>{placeLine(p)}</div>
          <div style={{ display: "flex", fontSize: square ? 34 : 30, color: "#94a3b8" }}>{copy.caption(p)}</div>
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
          <div style={{ display: "flex", color: "#fbbf24", fontWeight: 700 }}>Check yours — free, no signup</div>
          <div style={{ display: "flex", color: "#94a3b8" }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
