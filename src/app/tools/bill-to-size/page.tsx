import type { Metadata } from "next";
import { ToolPage, toolMetadata } from "@/components/pages/ToolPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export const metadata: Metadata = toolMetadata("bill-to-size", DEFAULT_LOCALE);

export default function Page() {
  return <ToolPage slug="bill-to-size" lang={DEFAULT_LOCALE} />;
}
