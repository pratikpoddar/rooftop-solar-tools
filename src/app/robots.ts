import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
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
