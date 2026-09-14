import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { findUnreconciled, reconcile } from "./reconcile";

/**
 * The guides section: 56 long-form articles in 11 clusters.
 *
 * Read from src/content/guides at build time. Everything is static, so this
 * runs once during `next build` and never at request time.
 */

const DIR = path.join(process.cwd(), "src", "content", "guides");

/** Cluster ids, in the order the content plan lays them out. */
export const CLUSTERS = [
  { slug: "basics", title: "Solar basics", blurb: "How rooftop solar actually works, and whether it is worth it for your home." },
  { slug: "costs", title: "Costs and financing", blurb: "What a system costs, what the subsidy covers, and how people pay for it." },
  { slug: "subsidy", title: "Subsidy and schemes", blurb: "PM Surya Ghar, state top-ups, net metering, and the paperwork that releases the money." },
  { slug: "components", title: "Panels, inverters and batteries", blurb: "What goes on the roof, what it does, and which choices actually matter." },
  { slug: "sizing", title: "Sizing your system", blurb: "How big a system your bill and your roof justify." },
  { slug: "installation", title: "Installation and installers", blurb: "The process end to end, and how to tell a good quote from a padded one." },
  { slug: "maintenance", title: "Maintenance and performance", blurb: "Keeping the system producing, and diagnosing it when it does not." },
  { slug: "savings", title: "Savings and returns", blurb: "What solar returns, and how it compares with leaving the money elsewhere." },
  { slug: "business", title: "Solar for small business", blurb: "Rooftop solar for shops, clinics and SMEs, where the tax treatment differs." },
  { slug: "cities", title: "City guides", blurb: "Local costs, DISCOM rules and feasibility, city by city." },
  { slug: "decisions", title: "Decisions and FAQs", blurb: "The last questions people ask before committing." },
] as const;

export type ClusterSlug = (typeof CLUSTERS)[number]["slug"];

/** Article number → cluster, following the content plan's grouping. */
function clusterFor(n: number): ClusterSlug {
  if (n <= 5) return "basics";
  if (n <= 10) return "costs";
  if (n <= 15) return "subsidy";
  if (n <= 20) return "components";
  if (n <= 25) return "sizing";
  if (n <= 30) return "installation";
  if (n <= 35) return "maintenance";
  if (n <= 40) return "savings";
  if (n <= 47) return "business";
  if (n <= 54) return "cities";
  return "decisions";
}

/**
 * City articles whose queries the programmatic /solar-panel-price pages already
 * target. Those pages embed a live calculator, which is the thing pure content
 * cannot copy, so they keep the keyword: these articles carry a canonical
 * pointing at them and link through, rather than competing for the same term.
 */
const CITY_CANONICALS: Record<string, string> = {
  "rooftop-solar-delhi-ncr": "/solar-panel-price/delhi",
  "rooftop-solar-bangalore-bescom": "/solar-panel-price/bengaluru",
  "rooftop-solar-mumbai": "/solar-panel-price/mumbai",
  "rooftop-solar-hyderabad": "/solar-panel-price/hyderabad",
  "rooftop-solar-pune": "/solar-panel-price/pune",
  "rooftop-solar-chennai-tangedco": "/solar-panel-price/chennai",
  "rooftop-solar-ahmedabad-gujarat": "/solar-panel-price/ahmedabad",
};

/** Which calculator, if any, belongs inside an article (spec §5: the ranking moat). */
function toolFor(slug: string): "subsidy" | "size" | "savings" | "emi" | null {
  if (/subsidy|surya-ghar|state-wise|documents-required/.test(slug)) return "subsidy";
  if (/payback|roi|savings|worth-it|tariff-hikes|fixed-deposit|property-value/.test(slug)) return "savings";
  if (/financing|loans-emi|leasing/.test(slug)) return "emi";
  if (/size|sizing|how-many-solar-panels|roof-space|electricity-bill/.test(slug)) return "size";
  if (/cost|price|hidden-costs|quotation/.test(slug)) return "subsidy";
  return null;
}

export interface Guide {
  /** URL slug, with the numeric ordering prefix stripped. */
  slug: string;
  /** Original file order, 1-56. */
  order: number;
  cluster: ClusterSlug;
  title: string;
  seoTitle: string;
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  html: string;
  /** Minutes, at 220 wpm. */
  readingMinutes: number;
  /** Related articles, resolved from the source's Related Reading links. */
  related: { slug: string; title: string }[];
  /** Set when a programmatic page owns this article's keyword. */
  canonicalTo?: string;
  tool: ReturnType<typeof toolFor>;
  /** Reconciliation rules that fired on this article. */
  reconciled: string[];
}

function field(body: string, label: string): string {
  const m = body.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, "m"));
  return m ? m[1].trim() : "";
}

let cache: Guide[] | null = null;

export function allGuides(): Guide[] {
  if (cache) return cache;

  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("00-"))
    .sort();

  const guides: Guide[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(DIR, file), "utf8");
    const order = Number(file.slice(0, 2));
    const slug = file.replace(/^\d\d-/, "").replace(/\.md$/, "");

    const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? slug).trim();
    const seoTitle = field(raw, "SEO Title") || title;
    const metaDescription = field(raw, "Meta Description");
    const targetKeyword = field(raw, "Target Keyword");
    const secondaryKeywords = field(raw, "Secondary Keywords")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const searchIntent = field(raw, "Search Intent");

    // Strip the H1 and the SEO block; the page renders those as chrome.
    let body = raw.replace(/^#\s+.+$/m, "");
    body = body.replace(/^\*\*(?:SEO Title|Meta Description|Target Keyword|Secondary Keywords|Search Intent):\*\*.*$/gm, "");

    // Pull out Related Reading so it renders as navigation rather than prose.
    const related: { slug: string; title: string }[] = [];
    const relIdx = body.search(/^##\s+Related Reading\s*$/m);
    if (relIdx >= 0) {
      const tail = body.slice(relIdx);
      for (const m of tail.matchAll(/\[([^\]]+)\]\(\.\/(?:\d\d-)?([a-z0-9-]+)\)/g)) {
        related.push({ title: m[1], slug: m[2].replace(/^\d\d-/, "") });
      }
      body = body.slice(0, relIdx);
    }

    const { text, applied } = reconcile(body);
    const words = text.split(/\s+/).filter(Boolean).length;

    return {
      slug,
      order,
      cluster: clusterFor(order),
      title,
      seoTitle,
      metaDescription,
      targetKeyword,
      secondaryKeywords,
      searchIntent,
      html: marked.parse(text.trim(), { async: false }) as string,
      readingMinutes: Math.max(1, Math.round(words / 220)),
      related,
      canonicalTo: CITY_CANONICALS[slug],
      tool: toolFor(slug),
      reconciled: applied,
    };
  });

  cache = guides;
  return guides;
}

export function getGuide(slug: string): Guide | undefined {
  return allGuides().find((g) => g.slug === slug);
}

export function guidesInCluster(cluster: ClusterSlug): Guide[] {
  return allGuides()
    .filter((g) => g.cluster === cluster)
    .sort((a, b) => a.order - b.order);
}

export function getCluster(slug: string) {
  return CLUSTERS.find((c) => c.slug === slug);
}

/** Build-time audit: any article still carrying a figure the engine disagrees with. */
export function reconciliationReport() {
  return allGuides().map((g) => ({
    slug: g.slug,
    applied: g.reconciled,
    stale: findUnreconciled(g.html),
  }));
}
