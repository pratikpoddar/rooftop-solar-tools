import type { Metadata } from "next";
import { ToolPage, toolMetadata } from "@/components/pages/ToolPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export const metadata: Metadata = toolMetadata("savings-payback", DEFAULT_LOCALE);

export default function Page() {
  return <ToolPage slug="savings-payback" lang={DEFAULT_LOCALE} />;
}
