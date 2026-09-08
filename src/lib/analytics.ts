/**
 * Event schema (spec §8). Kept tiny and typed so every tool fires the same five
 * events with the same dimensions, which is what makes the funnel in §11
 * (view → started → completed → shared → lead) computable per tool/lang/city.
 */
export type AnalyticsEvent =
  | "tool_started"
  | "tool_completed"
  | "card_shared"
  | "lead_submitted"
  | "assumptions_opened";

export interface EventProps {
  tool: string;
  lang?: string;
  state?: string;
  city?: string;
  kw?: number;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, props: EventProps): void {
  if (typeof window === "undefined") return;
  const payload = { lang: "en", ...props };
  window.gtag?.("event", event, payload);
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, payload);
  }
}

/** Fires tool_started once per tool per page view. */
export function makeStartTracker(tool: string) {
  let fired = false;
  return (props: Omit<EventProps, "tool"> = {}) => {
    if (fired) return;
    fired = true;
    track("tool_started", { tool, ...props });
  };
}
