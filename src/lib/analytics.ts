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
    goatcounter?: {
      count?: (vars: { path: string; title?: string; event?: boolean }) => void;
    };
  }
}

export const GOATCOUNTER_ENDPOINT =
  process.env.NEXT_PUBLIC_GOATCOUNTER ?? "https://pratikpoddar.goatcounter.com/count";

export const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

/**
 * GoatCounter records a path and a title, not an arbitrary property bag, so an
 * event has to be encoded into its path. Keeping the dimensions the §11 funnel
 * needs — tool, then state or city — in a readable hierarchy means the counts
 * group usefully in the dashboard rather than arriving as one undifferentiated
 * total per event name.
 *
 * e.g. tool_completed on the Pune savings calculator becomes
 *   /event/tool_completed/savings/pune
 */
export function eventPath(event: AnalyticsEvent, props: EventProps): string {
  const parts = [event, props.tool, props.city ?? props.state].filter(Boolean);
  return `/event/${parts.join("/")}`;
}

export function track(event: AnalyticsEvent, props: EventProps): void {
  if (typeof window === "undefined") return;
  const payload = { lang: "en", ...props };

  // GA4 stays wired for anyone who sets NEXT_PUBLIC_GA_ID; it is inert otherwise.
  window.gtag?.("event", event, payload);

  if (ANALYTICS_ENABLED) {
    window.goatcounter?.count?.({
      path: eventPath(event, payload),
      title: `${event} · ${payload.tool}`,
      event: true,
    });
  }

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
