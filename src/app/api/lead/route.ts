import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Lead capture (spec §6).
 *
 * Phase 0 sink is a Google Apps Script webhook, set via SHEETS_WEBHOOK_URL.
 * The hard rules from the spec are enforced here, not just in the UI:
 *   - nothing is accepted without explicit consent
 *   - the consent text and timestamp are stored with the lead, so what the
 *     user actually agreed to is recoverable later
 *   - identifiable data is only ever forwarded to the CRM sink, never sold
 *
 * Deliberately absent in Phase 0: OTP. Leads carry phoneVerified:false so the
 * CRM can distinguish them once MSG91 is wired in Phase 2.
 */

export interface LeadPayload {
  name: string;
  phone: string;
  pin?: string;
  stateSlug?: string;
  citySlug?: string;
  kw?: number;
  monthlyBill?: number;
  language?: string;
  tool: string;
  sourcePage: string;
  consentGiven: boolean;
  consentText: string;
}

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

/**
 * Coarse per-IP throttle. Serverless instances are not shared, so this stops
 * casual hammering rather than a determined attacker — Phase 2 moves the limit
 * into the CRM/edge layer alongside OTP.
 */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  let body: Partial<LeadPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const errors: string[] = [];
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").replace(/\D/g, "");

  if (name.length < 2 || name.length > 80) errors.push("name");
  if (!PHONE_RE.test(phone)) errors.push("phone");
  if (body.pin && !PIN_RE.test(body.pin)) errors.push("pin");
  if (!body.tool) errors.push("tool");

  // The consent gate. No consent, no lead — this is not a soft validation.
  if (body.consentGiven !== true || !body.consentText) {
    return NextResponse.json(
      { error: "Consent is required before we can introduce you to any installer." },
      { status: 422 },
    );
  }

  if (errors.length) {
    return NextResponse.json({ error: "Invalid fields.", fields: errors }, { status: 400 });
  }

  const lead = {
    receivedAt: new Date().toISOString(),
    name,
    phone,
    phoneVerified: false,
    pin: body.pin ?? null,
    stateSlug: body.stateSlug ?? null,
    citySlug: body.citySlug ?? null,
    kw: body.kw ?? null,
    monthlyBill: body.monthlyBill ?? null,
    language: body.language ?? "en",
    tool: body.tool,
    sourcePage: body.sourcePage ?? null,
    consentGiven: true,
    consentText: body.consentText,
    /** Routing happens downstream; recorded here so the CRM can dedupe by phone over 90 days. */
    routingStatus: "pending" as const,
  };

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    // Fail loudly in production rather than silently dropping a real lead.
    if (process.env.NODE_ENV === "production") {
      console.error("[lead] SHEETS_WEBHOOK_URL is not set — lead not persisted", { tool: lead.tool });
      return NextResponse.json({ error: "Lead capture is not configured." }, { status: 503 });
    }
    console.info("[lead] no webhook configured; would have sent:", lead);
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
    });

    const body = await res.text();

    if (!res.ok) {
      /*
       * Apps Script answers an unauthorised request with a 403 HTML page rather
       * than anything machine-readable, and "webhook 403" on its own sends you
       * hunting in the wrong place. This is the single most likely
       * misconfiguration, so name it in the log.
       */
      const hint =
        res.status === 403 || /Access denied|You need access/i.test(body)
          ? ' — the Apps Script deployment is not public. Set "Who has access" to "Anyone" under Deploy → Manage deployments.'
          : "";
      throw new Error(`webhook returned ${res.status}${hint}`);
    }

    /*
     * A 200 is not success. Apps Script returns 200 with {ok:false,error:...}
     * when doPost rejects the payload or appendRow throws, so trusting the
     * status alone reports "Done" to the user while the lead is dropped.
     */
    let parsed: { ok?: boolean; error?: string } | null = null;
    try {
      parsed = JSON.parse(body) as { ok?: boolean; error?: string };
    } catch {
      // Not JSON. Apps Script only returns HTML when something is wrong.
      throw new Error(`webhook returned a non-JSON body: ${body.slice(0, 200)}`);
    }

    if (parsed?.ok !== true) {
      throw new Error(`webhook rejected the lead: ${parsed?.error ?? "no reason given"}`);
    }
  } catch (err) {
    console.error("[lead] webhook failed:", err instanceof Error ? err.message : err, {
      tool: lead.tool,
      sourcePage: lead.sourcePage,
    });
    return NextResponse.json({ error: "Could not record that. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
