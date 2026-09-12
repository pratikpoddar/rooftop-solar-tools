import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { decodeSession } from "@/lib/share";
import { DEFAULT_LOCALE, isLaunched, isLocale, localePath } from "@/i18n/locales";

/**
 * Short links (spec §4.2).
 *
 * The session travels inside the token, so a shared link never depends on a
 * database row surviving. It reopens the same tool prefilled to the sender's
 * city — the recipient's flow starts at step 2, not step 1.
 */
export const dynamic = "force-dynamic";

const TOOL_PATHS: Record<string, string> = {
  subsidy: "/tools/subsidy-calculator",
  size: "/tools/bill-to-size",
  savings: "/tools/savings-payback",
  emi: "/tools/loan-emi",
};

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const session = decodeSession(token);
  const tool = session?.t ?? "savings";
  return {
    title: "See what your own roof would save",
    robots: { index: false, follow: true },
    alternates: { canonical: TOOL_PATHS[tool] ?? "/" },
  };
}

export default async function ShortLinkPage({ params }: Props) {
  const { token } = await params;
  const session = decodeSession(token);

  if (!session) redirect("/");

  const tool = TOOL_PATHS[session.t] ?? "/tools/savings-payback";

  // Reopen in the sender's language when they had one, so a shared Tamil
  // result does not land the recipient in English.
  const lang = session.l && isLocale(session.l) && isLaunched(session.l) ? session.l : DEFAULT_LOCALE;
  const base = localePath(lang, tool);
  const q = new URLSearchParams();
  if (session.s) q.set("state", session.s);
  if (session.c) q.set("city", session.c);
  if (session.d) q.set("discom", session.d);
  if (session.k) q.set("kw", String(session.k));
  if (session.u) q.set("units", String(session.u));
  if (session.b) q.set("bill", String(session.b));
  q.set("via", "share");

  redirect(`${base}?${q.toString()}`);
}
