import { describe, expect, it } from "vitest";
import { CLUSTERS, allGuides, getGuide, guidesInCluster, reconciliationReport, type ClusterSlug } from "../index";
import { RULES, findUnreconciled, subsidyAgreement } from "../reconcile";
import { COST_ANCHORS, PER_WATT } from "@/data/solar-engine";

describe("guides content", () => {
  it("loads all 56 articles into 11 clusters", () => {
    expect(allGuides()).toHaveLength(56);
    const counted = CLUSTERS.reduce((n, c) => n + guidesInCluster(c.slug as ClusterSlug).length, 0);
    expect(counted).toBe(56);
  });

  it("strips the ordering prefix from every URL slug", () => {
    for (const g of allGuides()) {
      expect(g.slug, g.slug).not.toMatch(/^\d\d-/);
      expect(g.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("gives every article the SEO fields the content plan promised", () => {
    for (const g of allGuides()) {
      expect(g.seoTitle.length, g.slug).toBeGreaterThan(10);
      expect(g.metaDescription.length, g.slug).toBeGreaterThan(50);
      expect(g.targetKeyword.length, g.slug).toBeGreaterThan(3);
      expect(g.html.length, g.slug).toBeGreaterThan(2000);
    }
  });

  it("leaves no SEO front-matter visible in the rendered body", () => {
    for (const g of allGuides()) {
      expect(g.html, g.slug).not.toContain("SEO Title:");
      expect(g.html, g.slug).not.toContain("Target Keyword:");
      expect(g.html, g.slug).not.toContain("Search Intent:");
    }
  });

  it("resolves related links to articles that exist", () => {
    for (const g of allGuides()) {
      if (!g.related.length) continue;
      const resolved = g.related.filter((r) => getGuide(r.slug)).length;
      expect(resolved / g.related.length, g.slug).toBeGreaterThan(0.7);
    }
  });
});

describe("figure reconciliation against the numbers engine", () => {
  it("carries no figure the engine disagrees with", () => {
    // The point of one engine is that two pages cannot quote different prices.
    const stale = reconciliationReport().filter((r) => r.stale.length);
    expect(stale.map((s) => `${s.slug}: ${s.stale.join(",")}`)).toEqual([]);
  });

  it("actually rewrote the cost claims rather than silently passing", () => {
    const touched = reconciliationReport().filter((r) => r.applied.length);
    expect(touched.length).toBeGreaterThanOrEqual(45);
  });

  it("puts the engine's own numbers into the rewritten text", () => {
    const g = getGuide("rooftop-solar-system-cost-india-2026")!;
    expect(g.reconciled).toContain("per-kw-range");
    expect(g.html).toContain(`Rs ${PER_WATT.min}-${PER_WATT.max} per watt`);
    // Asserted against what the rule produces from the engine, so changing an
    // anchor updates the expectation instead of breaking the test.
    const threeKw = RULES.find((r) => r.id === "price-3kw")!.replace();
    expect(g.html).toContain(threeKw);
    expect(COST_ANCHORS.find((a) => a.kw === 3)!.min).toBe(150000);
  });

  it("replaces the flat national payback band with the real spread", () => {
    const g = getGuide("solar-payback-period-india")!;
    expect(findUnreconciled(g.html)).toEqual([]);
    expect(g.html).toMatch(/about 2 years to over 10/);
  });

  it("states a price band's unit once, not twice", () => {
    // "Rs 1.5 lakh-Rs 1.95 lakh" is what naive concatenation produces, and
    // these land mid-sentence in running prose.
    for (const id of ["price-1kw", "price-2kw", "price-3kw", "price-5kw", "price-10kw"]) {
      const rule = RULES.find((r) => r.id === id)!;
      expect(rule.replace(), id).not.toMatch(/lakh-Rs|crore-Rs/);
    }
    expect(RULES.find((r) => r.id === "price-3kw")!.replace()).toBe("Rs 1.5-1.95 lakh");
  });

  it("confirms the subsidy figures the articles quote", () => {
    for (const row of subsidyAgreement()) {
      expect(row.agrees, `${row.kw} kW: article ${row.article} vs engine ${row.engine}`).toBe(true);
    }
  });
});

describe("city guides defer to the pages that own their keyword", () => {
  it("canonicalises each city article to its programmatic page", () => {
    const cities = guidesInCluster("cities");
    expect(cities).toHaveLength(7);
    for (const g of cities) {
      expect(g.canonicalTo, g.slug).toMatch(/^\/solar-panel-price\/[a-z-]+$/);
    }
  });
});

describe("embedded calculators", () => {
  it("puts the right tool on the money articles", () => {
    expect(getGuide("rooftop-solar-system-cost-india-2026")!.tool).toBe("subsidy");
    expect(getGuide("solar-payback-period-india")!.tool).toBe("savings");
    expect(getGuide("solar-panel-financing-india-loans-emi")!.tool).toBe("emi");
    expect(getGuide("what-size-solar-system-india-sizing-guide")!.tool).toBe("size");
  });

  it("embeds a calculator on a decent share of articles", () => {
    expect(allGuides().filter((g) => g.tool).length).toBeGreaterThan(20);
  });
});
