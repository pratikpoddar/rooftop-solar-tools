import type { Metadata } from "next";
import { ToolPage, toolMetadata } from "@/components/pages/ToolPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export const metadata: Metadata = toolMetadata("loan-emi", DEFAULT_LOCALE);

export default function Page() {
  return <ToolPage slug="loan-emi" lang={DEFAULT_LOCALE} />;
}
