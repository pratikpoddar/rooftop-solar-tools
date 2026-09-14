import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allGuides, getCluster, getGuide, guidesInCluster } from "@/lib/guides";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { ToolMount } from "@/components/tools/ToolMount";
import { Breadcrumbs, Callout, Container, Disclaimer, LinkList, SectionHeading } from "@/components/ui";

export function generateStaticParams() {
  return allGuides().map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.seoTitle,
    description: g.metaDescription,
    keywords: [g.targetKeyword, ...g.secondaryKeywords],
    /*
     * City guides point their canonical at the programmatic page that already
     * targets the same query and embeds a live calculator, so the two feed one
     * ranking signal instead of splitting it.
     */
    alternates: { canonical: g.canonicalTo ?? `/guides/${g.slug}` },
    openGraph: { title: g.seoTitle, description: g.metaDescription, type: "article", url: absoluteUrl(`/guides/${g.slug}`) },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const cluster = getCluster(g.cluster)!;
  const siblings = guidesInCluster(g.cluster).filter((s) => s.slug !== g.slug);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: cluster.title, href: `/guides/topic/${cluster.slug}` },
    { label: g.title },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs trail={trail} />

      <article>
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
            {cluster.title} · {g.readingMinutes} min read
          </p>
          <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{g.title}</h1>
          {g.metaDescription ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--fg-muted)]">{g.metaDescription}</p>
          ) : null}
        </header>

        {g.canonicalTo ? (
          <Callout className="mt-5">
            <p>
              For live prices, generation and payback for this city, see{" "}
              <Link href={g.canonicalTo} className="font-semibold text-[var(--accent)] underline underline-offset-2">
                the {g.title.replace(/^Rooftop Solar in /i, "").split(":")[0]} solar price page
              </Link>
              , which runs the numbers against your own bill.
            </p>
          </Callout>
        ) : null}

        <div className="guide-prose mt-6" dangerouslySetInnerHTML={{ __html: g.html }} />

        <Disclaimer className="mt-6" />
      </article>

      {g.tool ? (
        <section className="mt-10" id="calculator">
          <SectionHeading className="mb-3">Run these numbers for your own home</SectionHeading>
          <ToolMount kind={g.tool} sourcePage={`/guides/${g.slug}`} />
        </section>
      ) : null}

      <div className="mt-10 space-y-6">
        {g.related.length ? (
          <LinkList
            title="Related reading"
            links={g.related
              .filter((r) => getGuide(r.slug))
              .map((r) => ({ href: `/guides/${r.slug}`, label: r.title }))}
          />
        ) : null}
        {siblings.length ? (
          <LinkList
            title={`More on ${cluster.title.toLowerCase()}`}
            links={siblings.slice(0, 6).map((s) => ({ href: `/guides/${s.slug}`, label: s.title }))}
          />
        ) : null}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.seoTitle,
          description: g.metaDescription,
          inLanguage: "en-IN",
          mainEntityOfPage: absoluteUrl(g.canonicalTo ?? `/guides/${g.slug}`),
          about: g.targetKeyword,
        })}
      />
    </Container>
  );
}
