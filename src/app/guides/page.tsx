import type { Metadata } from "next";
import Link from "next/link";
import { CLUSTERS, allGuides, guidesInCluster, type ClusterSlug } from "@/lib/guides";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Container, Prose, SectionHeading } from "@/components/ui";

const TITLE = "Rooftop Solar Guides for India";
const DESCRIPTION =
  "Plain-English guides to rooftop solar in India: what it costs, what the PM Surya Ghar subsidy covers, how to size a system, how to pick an installer, and what it actually saves.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Guides" }];

export default function GuidesIndexPage() {
  const total = allGuides().length;

  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rooftop solar guides</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          {total} guides covering the whole decision, from how a rooftop system actually works to what to check on a
          quotation. Every rupee figure here comes from the same numbers engine as the calculators, so a guide and a
          calculator on this site will never quote you different prices.
        </p>
      </Prose>

      <div className="mt-8 space-y-8">
        {CLUSTERS.map((c) => {
          const guides = guidesInCluster(c.slug as ClusterSlug);
          return (
            <section key={c.slug}>
              <SectionHeading as="h2">
                <Link href={`/guides/topic/${c.slug}`} className="text-[var(--accent)] hover:underline">
                  {c.title}
                </Link>
              </SectionHeading>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{c.blurb}</p>
              <ul className="mt-3 space-y-1.5">
                {guides.map((g) => (
                  <li key={g.slug} className="text-sm">
                    <Link href={`/guides/${g.slug}`} className="hover:text-[var(--accent)] hover:underline">
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
