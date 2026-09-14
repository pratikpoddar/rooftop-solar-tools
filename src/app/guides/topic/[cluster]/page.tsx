import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLUSTERS, getCluster, guidesInCluster, type ClusterSlug } from "@/lib/guides";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Card, Container, LinkList, Prose, SectionHeading } from "@/components/ui";

export function generateStaticParams() {
  return CLUSTERS.map((c) => ({ cluster: c.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ cluster: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cluster } = await params;
  const c = getCluster(cluster);
  if (!c) return {};
  const n = guidesInCluster(c.slug as ClusterSlug).length;
  const title = `${c.title}: ${n} Rooftop Solar Guides for India`;
  return {
    title,
    description: c.blurb,
    alternates: { canonical: `/guides/topic/${c.slug}` },
    openGraph: { title, description: c.blurb },
  };
}

export default async function ClusterPage({ params }: Props) {
  const { cluster } = await params;
  const c = getCluster(cluster);
  if (!c) notFound();

  const guides = guidesInCluster(c.slug as ClusterSlug);
  const others = CLUSTERS.filter((x) => x.slug !== c.slug);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: c.title },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs trail={trail} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">{c.blurb}</p>
      </Prose>

      <div className="mt-6 space-y-3">
        {guides.map((g) => (
          <Card key={g.slug} tone="soft" className="p-4">
            <Link href={`/guides/${g.slug}`} className="group block">
              <SectionHeading as="h2" className="text-[var(--accent)] group-hover:underline">
                {g.title}
              </SectionHeading>
              <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">{g.metaDescription}</p>
              <p className="mt-1.5 text-xs text-[var(--fg-subtle)]">{g.readingMinutes} min read</p>
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <LinkList
          title="Other topics"
          links={others.map((o) => ({ href: `/guides/topic/${o.slug}`, label: o.title }))}
        />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
    </Container>
  );
}
