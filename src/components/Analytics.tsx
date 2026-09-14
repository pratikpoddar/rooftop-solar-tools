"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_ENABLED, GOATCOUNTER_ENDPOINT } from "@/lib/analytics";

/**
 * GoatCounter.
 *
 * Chosen over a cookie-based analytics product for a site that already asks
 * people to hand over a phone number: it sets no cookies, stores no personal
 * data and does not track anyone across sites, so the privacy page can describe
 * it in one honest sentence rather than a paragraph of carve-outs.
 *
 * `count.js` only fires on load, so an App Router client-side navigation would
 * otherwise go uncounted — most navigation on this site is exactly that, tool
 * to tool and guide to guide. The effect below counts each path change, and
 * skips the first one because the script has already counted it.
 */
export function Analytics() {
  const pathname = usePathname();
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (!ANALYTICS_ENABLED || !pathname) return;
    // The initial load is counted by the script itself; do not double-count it.
    if (counted.current === null) {
      counted.current = pathname;
      return;
    }
    if (counted.current === pathname) return;
    counted.current = pathname;
    window.goatcounter?.count?.({ path: pathname, title: document.title });
  }, [pathname]);

  if (!ANALYTICS_ENABLED) return null;

  return (
    <Script
      data-goatcounter={GOATCOUNTER_ENDPOINT}
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  );
}
