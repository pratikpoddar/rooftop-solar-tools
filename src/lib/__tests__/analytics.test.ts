import { describe, expect, it } from "vitest";
import { eventPath } from "@/lib/analytics";

/**
 * GoatCounter records a path, not a property bag, so the §11 funnel dimensions
 * have to survive the trip into a URL. If this encoding collapses, every event
 * lands as one undifferentiated total and the funnel stops being readable.
 */
describe("event paths", () => {
  it("keeps tool and place as a readable hierarchy", () => {
    expect(eventPath("tool_completed", { tool: "savings", city: "pune", state: "maharashtra" })).toBe(
      "/event/tool_completed/savings/pune",
    );
  });

  it("falls back to state when there is no city", () => {
    expect(eventPath("tool_started", { tool: "subsidy", state: "gujarat" })).toBe(
      "/event/tool_started/subsidy/gujarat",
    );
  });

  it("drops empty segments rather than emitting //", () => {
    expect(eventPath("lead_submitted", { tool: "emi" })).toBe("/event/lead_submitted/emi");
    expect(eventPath("card_shared", { tool: "" })).toBe("/event/card_shared");
  });

  it("namespaces events so they never collide with real page paths", () => {
    // A page called /tools/savings-payback must not be confused with an event.
    for (const e of ["tool_started", "tool_completed", "card_shared", "lead_submitted"] as const) {
      expect(eventPath(e, { tool: "savings", city: "pune" })).toMatch(/^\/event\//);
    }
  });
});
