import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { INDEXING_ALLOWED, SITE } from "@/lib/site";
import { jsonLd, organizationSchema, webSiteSchema } from "@/lib/schema";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Analytics } from "@/components/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: {
    canonical: "/",
    languages: { "x-default": "/", "en-IN": "/" },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image" },
  /*
   * robots.txt alone is a request, not a guarantee — a page linked from
   * elsewhere can still be indexed. The meta tag is the one crawlers honour,
   * so the gate is applied in both places.
   */
  robots: INDEXING_ALLOWED
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--bg)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
        >
          {"Skip to content"}
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />

        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationSchema())} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webSiteSchema())} />

        <Analytics />

        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true});`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
