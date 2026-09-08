"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { en } from "@/i18n/en";
import { NumberInput, Toggle } from "./controls";
import { Callout, Card, SectionHeading, buttonClasses } from "./ui";

/**
 * Lead capture (spec §6).
 *
 * Two hard product rules from the owner, enforced here rather than in policy:
 * the consent checkbox is unticked by default and names the disclosure in
 * plain words, and nothing is submitted without it. The consent text and a
 * timestamp travel with the lead so what the user agreed to is recoverable.
 *
 * Phase 0 has no OTP — the payload carries phoneVerified:false so the CRM can
 * tell verified leads from unverified ones once MSG91 is wired in Phase 2.
 */
export function LeadForm({
  tool,
  stateSlug,
  citySlug,
  kw,
  monthlyBill,
  sourcePage,
}: {
  tool: string;
  stateSlug?: string;
  citySlug?: string;
  kw?: number;
  monthlyBill?: number;
  sourcePage: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<number | "">("");
  const [pin, setPin] = useState<number | "">("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = String(phone);
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consent) return setError(en.lead.consentRequired);
    if (!phoneValid) return setError(en.lead.phoneInvalid);

    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
          pin: pin === "" ? undefined : String(pin),
          stateSlug,
          citySlug,
          kw,
          monthlyBill,
          language: "en",
          tool,
          sourcePage,
          consentGiven: true,
          consentText: en.lead.consent,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      track("lead_submitted", { tool, state: stateSlug, city: citySlug, kw });
    } catch {
      setStatus("error");
      setError(en.lead.error);
    }
  }

  if (status === "done") {
    return (
      <Card tone="soft" className="p-4">
        <Callout tone="good" title={en.lead.success}>
          <p>They will quote against your city&apos;s price band, which you can see above — so you can tell a fair quote from a padded one.</p>
        </Callout>
      </Card>
    );
  }

  return (
    <Card tone="soft" className="p-4">
      <SectionHeading as="h3">{en.lead.title}</SectionHeading>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">{en.lead.lede}</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="lead-name" className="block text-sm font-medium">
            {en.lead.name}
          </label>
          <input
            id="lead-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-base focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput
            label={en.lead.phone}
            prefix="+91"
            value={phone}
            onChange={setPhone}
            placeholder="9876543210"
            min={6000000000}
            max={9999999999}
          />
          <NumberInput label={en.lead.pin} value={pin} onChange={setPin} placeholder="400001" min={100000} max={999999} />
        </div>

        <Toggle label={en.lead.consent} checked={consent} onChange={setConsent} />

        {error ? (
          <p role="alert" className="text-sm font-medium text-[var(--warn)]">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={status === "sending"} className={`${buttonClasses("primary")} w-full`}>
          {status === "sending" ? en.lead.submitting : en.lead.submit}
        </button>

        <p className="text-xs text-[var(--fg-subtle)]">
          We never sell your details. The only thing that happens is an introduction to installers you asked for.
        </p>
      </form>
    </Card>
  );
}
