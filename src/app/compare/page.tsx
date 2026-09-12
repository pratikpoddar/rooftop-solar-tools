import type { Metadata } from "next";
import Link from "next/link";
import { rupees } from "@/data/solar-engine";
import { buildComparison, comparisonPairs } from "@/lib/compare";
import { EXAMPLE_KW } from "@/lib/pages";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Container, Prose, TableWrap, Td, Th } from "@/components/ui";

const TITLE = "Rooftop Solar Compared, City by City";
const DESCRIPTION =
  "Side-by-side rooftop solar comparisons between Indian cities: subsidy, cost after subsidy, generation, tariff and payback on the same 3 kW system.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compare" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Compare" }];

export default function CompareIndexPage() {
  const rows = comparisonPairs()
    .map((p) => buildComparison(p.a, p.b))
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((x, y) => x.a.city.name.localeCompare(y.a.city.name));

  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rooftop solar, city vs city</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          Hardware costs much the same everywhere. What changes the answer is sunlight, what a unit of grid electricity
          costs you, and whether your state tops up the central subsidy — and those three pull in different directions,
          so the sunnier city is not always the better one. Every comparison below uses the same {EXAMPLE_KW} kW system
          and the same household consumption.
        </p>
      </Prose>

      <div className="mt-6">
        <TableWrap>
          <thead>
            <tr>
              <Th>Comparison</Th>
              <Th align="right">Pays back sooner</Th>
              <Th align="right">Subsidy gap</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const gap = Math.abs(c.a.subsidy - c.b.subsidy);
              return (
                <tr key={c.slug}>
                  <Td strong>
                    <Link href={`/compare/${c.slug}`} className="text-[var(--accent)] hover:underline">
                      {c.a.city.name} vs {c.b.city.name}
                    </Link>
                  </Td>
                  <Td align="right">
                    {c.winner.city.name} · {c.winner.paybackLabel}
                  </Td>
                  <Td align="right">{gap > 0 ? rupees(gap) : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
