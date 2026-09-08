import { Suspense } from "react";
import { Card } from "../ui";
import { PrefilledTool } from "./PrefilledTool";
import type { ToolKind } from "./PrefilledTool";

/**
 * Suspense boundary around the query-string read, so the page itself stays
 * static and only the calculator hydrates.
 */
export function ToolMount(props: {
  kind: ToolKind;
  sourcePage: string;
  fallback?: { stateSlug?: string; citySlug?: string; discomId?: string; kw?: number };
}) {
  return (
    <Suspense fallback={<ToolSkeleton />}>
      <PrefilledTool {...props} />
    </Suspense>
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
