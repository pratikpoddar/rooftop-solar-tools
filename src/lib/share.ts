import { SITE, absoluteUrl } from "./site";

/**
 * Share mechanics (spec §4). The rule inherited from Book Cricket: what gets
 * shared is a personalised result card, never a link to a replay. So every
 * share is an OG image carrying the sender's own number, plus a short link that
 * reopens the tool prefilled to the same city — the recipient starts at step 2.
 */

export type CardKind = "subsidy" | "savings" | "emi" | "size" | "compare";

export interface CardParams {
  kind: CardKind;
  /** The headline rupee figure the card exists to show off. */
  value: number;
  /** Secondary figure, e.g. the subsidy behind a savings number. */
  value2?: number;
  place: string;
  kw?: number;
  lang?: string;
  /**
   * Payback in years and the monthly bill saving.
   *
   * A 25-year total is the biggest number but the least legible one — nobody
   * feels "Rs 18 lakh over 25 years". "Rs 2,850 a month, pays back in 5.2
   * years" is the sentence people actually repeat to a neighbour, so the
   * savings card leads with those and keeps the lifetime figure as support.
   */
  payback?: number;
  monthly?: number;
  /** Second place name, for the city-vs-city card. */
  place2?: string;
}

export function ogImageUrl(p: CardParams): string {
  const q = new URLSearchParams({
    kind: p.kind,
    value: String(Math.round(p.value)),
    place: p.place,
  });
  if (p.value2 != null) q.set("value2", String(Math.round(p.value2)));
  if (p.kw != null) q.set("kw", String(p.kw));
  if (p.lang) q.set("lang", p.lang);
  if (p.payback != null && Number.isFinite(p.payback)) q.set("payback", String(p.payback));
  if (p.monthly != null) q.set("monthly", String(Math.round(p.monthly)));
  if (p.place2) q.set("place2", p.place2);
  return absoluteUrl(`/api/og?${q.toString()}`);
}

// ---------------------------------------------------------------------------
// Short links: /r/{token}
// ---------------------------------------------------------------------------

export interface SessionState {
  /** Tool slug. */
  t: string;
  /** State slug. */
  s?: string;
  /** City slug. */
  c?: string;
  /** DISCOM id. */
  d?: string;
  /** System size in kW. */
  k?: number;
  /** Monthly units. */
  u?: number;
  /** Monthly bill in Rs. */
  b?: number;
}

function toBase64Url(input: string): string {
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(input, "utf8").toString("base64") : btoa(input);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return typeof Buffer !== "undefined" ? Buffer.from(padded, "base64").toString("utf8") : atob(padded);
}

/**
 * The session is encoded into the token itself rather than stored, so Phase 0
 * needs no database and a link never 404s after a cache eviction.
 */
export function encodeSession(state: SessionState): string {
  return toBase64Url(JSON.stringify(state));
}

export function decodeSession(token: string): SessionState | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token));
    if (parsed && typeof parsed.t === "string") return parsed as SessionState;
    return null;
  } catch {
    return null;
  }
}

export function shortLink(state: SessionState): string {
  return absoluteUrl(`/r/${encodeSession(state)}`);
}

/**
 * WhatsApp deep link. The card image rides along as the OG image of the short
 * link, so WhatsApp renders the number in the preview — no attachment needed.
 */
export function whatsAppLink(text: string, link: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
}

export function canShareNatively(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export const SHARE_FOOTER = `Check yours on ${SITE.name}`;
