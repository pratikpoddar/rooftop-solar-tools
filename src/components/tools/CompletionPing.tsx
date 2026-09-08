"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires tool_completed exactly once per session per tool.
 *
 * A "completed" session is one that produced a result card, which is the north
 * star metric in spec §11 — so it must not be inflated by every slider nudge.
 */
export function CompletionPing({
  tool,
  state,
  city,
  kw,
}: {
  tool: string;
  state?: string;
  city?: string;
  kw?: number;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track("tool_completed", { tool, state, city, kw });
  }, [tool, state, city, kw]);
  return null;
}
