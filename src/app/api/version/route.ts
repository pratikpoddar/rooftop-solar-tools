import { NextResponse } from "next/server";
import { ENGINE_VERSION } from "@/data/solar-engine";
import { LAUNCHED_LOCALES } from "@/i18n/locales";

/**
 * What is actually deployed.
 *
 * Production once served a five-day-old build while every deploy preview
 * passed — the site was up and valid, and nothing said it was not the code that
 * had been merged. This endpoint makes that answerable in one request instead
 * of by noticing a missing page.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    {
      commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "unknown",
      engineVersion: ENGINE_VERSION,
      locales: LAUNCHED_LOCALES.map((l) => l.code),
      builtAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } },
  );
}
