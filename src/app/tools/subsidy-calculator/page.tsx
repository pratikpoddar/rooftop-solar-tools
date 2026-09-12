import type { Metadata } from "next";
import { ToolPage, toolMetadata } from "@/components/pages/ToolPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export const metadata: Metadata = toolMetadata("subsidy-calculator", DEFAULT_LOCALE);

export default function Page() {
  return <ToolPage slug="subsidy-calculator" lang={DEFAULT_LOCALE} />;
}
