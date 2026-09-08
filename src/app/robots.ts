import type { MetadataRoute } from "next";
import { INDEXING_ALLOWED, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Until the real domain is live, keep crawlers out entirely — see the note on
  // INDEXING_ALLOWED. Advertising a sitemap alongside a disallow-all rule would
  // be contradictory, so it is omitted in that state.
  if (!INDEXING_ALLOWED) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Short links are per-session redirects, not content to index.
        disallow: ["/r/", "/api/lead"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
