import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOOL_SLUGS, ToolPage, toolMetadata, type ToolSlug } from "@/components/pages/ToolPage";
import { PREFIXED_LOCALES, isLaunched, isLocale, type Locale } from "@/i18n/locales";

/**
 * Localized calculators.
 *
 * Only PREFIXED_LOCALES are generated — English keeps the bare /tools/... paths
 * so its existing URLs never move, and `dynamicParams = false` means /en/... is
 * a 404 rather than a duplicate of the canonical English page.
 */
export function generateStaticParams() {
  return PREFIXED_LOCALES.flatMap((lang) => TOOL_SLUGS.map((slug) => ({ lang, slug })));
}

export const dynamicParams = false;

type Props = { params: Promise<{ lang: string; slug: string }> };

function parse(lang: string, slug: string): { lang: Locale; slug: ToolSlug } | null {
  if (!isLocale(lang) || !isLaunched(lang)) return null;
  if (!(TOOL_SLUGS as readonly string[]).includes(slug)) return null;
  return { lang, slug: slug as ToolSlug };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const parsed = parse(lang, slug);
  return parsed ? toolMetadata(parsed.slug, parsed.lang) : {};
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  const parsed = parse(lang, slug);
  if (!parsed) notFound();
  return <ToolPage slug={parsed.slug} lang={parsed.lang} />;
}
