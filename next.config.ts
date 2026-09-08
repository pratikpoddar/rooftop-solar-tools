import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

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
