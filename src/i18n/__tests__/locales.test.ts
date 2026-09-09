import { describe, expect, it } from "vitest";
import { LAUNCHED_LOCALES, LOCALES, PREFIXED_LOCALES, hreflangAlternates, isLaunched, localePath } from "../locales";

describe("locale routing", () => {
  it("keeps English at the root and prefixes the rest", () => {
    expect(localePath("en", "/solar-subsidy/gujarat")).toBe("/solar-subsidy/gujarat");
    expect(localePath("hi", "/solar-subsidy/gujarat")).toBe("/hi/solar-subsidy/gujarat");
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("hi", "/")).toBe("/hi");
  });

  it("only routes and advertises locales whose catalogue is actually translated", () => {
    // An un-launched locale typechecks but holds English text; serving it would
    // publish duplicate English under an hreflang promising another language.
    expect(PREFIXED_LOCALES).not.toContain("ta");
    expect(isLaunched("ta")).toBe(false);
    expect(isLaunched("hi")).toBe(true);
    const alt = hreflangAlternates("/tools/subsidy-calculator");
    expect(Object.keys(alt)).toContain("hi-IN");
    expect(Object.keys(alt)).not.toContain("ta-IN");
    expect(alt["x-default"]).toBe("/tools/subsidy-calculator");
  });

  it("declares all eight locales so launching one is a flag flip", () => {
    expect(LOCALES).toHaveLength(8);
    expect(LAUNCHED_LOCALES.length).toBeLessThanOrEqual(LOCALES.length);
  });
});
