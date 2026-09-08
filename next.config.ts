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

const SITE_URL = resolveSiteUrl();

const nextConfig: NextConfig = {
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_SITE_URL: SITE_URL,
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

  async headers() {
    return [
      {
        // Result cards are pure functions of their query string.
        source: "/api/og",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
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
