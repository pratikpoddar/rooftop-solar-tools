import { describe, expect, it } from "vitest";
import { LAUNCHED_LOCALES, LOCALES, PREFIXED_LOCALES, hreflangAlternates, isLaunched, localePath } from "../locales";

describe("locale routing", () => {
  it("keeps English at the root and prefixes the rest", () => {
    expect(localePath("en", "/solar-subsidy/gujarat")).toBe("/solar-subsidy/gujarat");
    expect(localePath("hi", "/solar-subsidy/gujarat")).toBe("/hi/solar-subsidy/gujarat");
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("hi", "/")).toBe("/hi");
  });

  it("routes and advertises exactly the launched locales, whichever those are", () => {
    // Asserted as a relationship rather than a snapshot, so launching a language
    // does not require editing the test that guards launching languages.
    const launched = LOCALES.filter((l) => l.launched).map((l) => l.code);
    const unlaunched = LOCALES.filter((l) => !l.launched).map((l) => l.code);

    expect(PREFIXED_LOCALES.sort()).toEqual(launched.filter((c) => c !== "en").sort());
    for (const code of unlaunched) {
      expect(isLaunched(code), code).toBe(false);
      expect(PREFIXED_LOCALES, code).not.toContain(code);
    }

    const alt = hreflangAlternates("/tools/subsidy-calculator");
    for (const l of LOCALES) {
      const present = Object.keys(alt).includes(l.htmlLang);
      expect(present, `${l.code} in hreflang cluster`).toBe(l.launched);
    }
    expect(alt["x-default"]).toBe("/tools/subsidy-calculator");
  });

  it("declares all eight locales so launching one is a flag flip", () => {
    expect(LOCALES).toHaveLength(8);
    expect(LAUNCHED_LOCALES.length).toBeLessThanOrEqual(LOCALES.length);
  });
});
