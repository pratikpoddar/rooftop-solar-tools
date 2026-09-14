import type { NextConfig } from "next";

/**
 * Resolve the canonical site URL once, at build time.
 *
 * The value is injected as NEXT_PUBLIC_SITE_URL so the server and the browser
 * bundle read the same string — see the note in src/lib/site.ts for why this
 * cannot live in that module. An explicit env var always wins; the host's own
 * address is the safety net so a deploy is never self-inconsistent when someone
 * forgets to set it.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // Netlify: URL is the site's main address; DEPLOY_PRIME_URL is this branch's.
  if (process.env.NETLIFY) {
    const netlify = process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL ?? process.env.URL;
    if (netlify) return netlify.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "https://rooftopsolarindia.netlify.app";
}

/**
 * Whether crawlers may index this deployment.
 *
 * Production indexes; every other context does not. Deploy previews and branch
 * deploys share the site's content on a different hostname, so indexing them
 * would create duplicate content competing with the real pages — the opposite
 * of what a programmatic-SEO strategy needs.
 *
 * NEXT_PUBLIC_ALLOW_INDEXING overrides in either direction, so a launch can be
 * held back or forced without a code change.
 */
function resolveIndexing(): string {
  const explicit = process.env.NEXT_PUBLIC_ALLOW_INDEXING;
  if (explicit === "true" || explicit === "false") return explicit;

  // Netlify sets CONTEXT to production | deploy-preview | branch-deploy.
  if (process.env.NETLIFY) return process.env.CONTEXT === "production" ? "true" : "false";

  // Vercel sets production | preview | development.
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production" ? "true" : "false";

  // Local development: never advertise a laptop to Google.
  return "false";
}

/**
 * The commit this bundle was built from.
 *
 * Exists because production silently served a five-day-old build while every
 * deploy preview passed and every merge looked clean — the site was up, the
 * pages were valid, and nothing anywhere said "this is not the code you
 * merged". Publishing it makes that condition detectable from outside instead
 * of inferrable only by spotting a missing feature.
 *
 * Netlify sets COMMIT_REF; Vercel sets VERCEL_GIT_COMMIT_SHA.
 */
const BUILD_COMMIT =
  process.env.COMMIT_REF ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? "unknown";

/**
 * GoatCounter endpoint, and whether to load it at all.
 *
 * Only the production deploy counts. Deploy previews and branch deploys serve
 * the same pages on a different hostname, and local dev reloads constantly —
 * counting either inflates the numbers the §11 funnel is measured against, and
 * a funnel you cannot trust is worse than no funnel.
 */
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_GOATCOUNTER ?? "https://pratikpoddar.goatcounter.com/count";

function analyticsEnabled(): string {
  const explicit = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
  if (explicit === "true" || explicit === "false") return explicit;
  if (process.env.NETLIFY) return process.env.CONTEXT === "production" ? "true" : "false";
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production" ? "true" : "false";
  return "false";
}

const SITE_URL = resolveSiteUrl();
const ALLOW_INDEXING = resolveIndexing();

const nextConfig: NextConfig = {
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_SITE_URL: SITE_URL,
    NEXT_PUBLIC_ALLOW_INDEXING: ALLOW_INDEXING,
    NEXT_PUBLIC_BUILD_COMMIT: BUILD_COMMIT,
    NEXT_PUBLIC_GOATCOUNTER: ANALYTICS_ENDPOINT,
    NEXT_PUBLIC_ANALYTICS_ENABLED: analyticsEnabled(),
  },

  /**
   * The spec names some SEO surfaces at the root (§3) and others under /tools
   * (§5). The canonical home for a calculator is /tools/{slug}; these keep the
   * root-level query URLs alive and pointing at it.
   */
  async redirects() {
    return [
      { source: "/solar-subsidy-calculator", destination: "/tools/subsidy-calculator", permanent: true },
      { source: "/pm-surya-ghar-subsidy-calculator", destination: "/tools/subsidy-calculator", permanent: true },
      { source: "/what-size-solar", destination: "/tools/bill-to-size", permanent: true },
      { source: "/solar-savings-calculator", destination: "/tools/savings-payback", permanent: true },
      { source: "/is-solar-worth-it", destination: "/tools/savings-payback", permanent: true },
      { source: "/solar-loan-emi-calculator", destination: "/tools/loan-emi", permanent: true },
      { source: "/pm-surya-ghar-loan", destination: "/tools/loan-emi", permanent: true },
    ];
  },

  // Cache headers for the result cards live on the route itself, so the
  // cache-key directive stays next to the reason it is needed.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
