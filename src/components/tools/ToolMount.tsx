import { Suspense } from "react";
import { LocaleProvider } from "@/i18n/context";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { Card } from "../ui";
import { PrefilledTool } from "./PrefilledTool";
import type { ToolKind } from "./PrefilledTool";

/**
 * Suspense boundary around the query-string read, so the page itself stays
 * static and only the calculator hydrates.
 */
export function ToolMount({
  lang = DEFAULT_LOCALE,
  ...props
}: {
  kind: ToolKind;
  sourcePage: string;
  lang?: Locale;
  fallback?: { stateSlug?: string; citySlug?: string; discomId?: string; kw?: number };
}) {
  /*
   * The provider is mounted once here rather than threaded through each
   * calculator, because the interactive tree is several components deep and all
   * of them need strings.
   */
  return (
    <LocaleProvider lang={lang}>
      <Suspense fallback={<ToolSkeleton />}>
        <PrefilledTool {...props} />
      </Suspense>
    </LocaleProvider>
  );
}

function ToolSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="space-y-4" aria-busy="true" aria-label="Loading calculator">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-[var(--bg-inset)]" />
            <div className="h-11 rounded-lg bg-[var(--bg-inset)]" />
          </div>
        ))}
      </div>
    </Card>
  );
}
