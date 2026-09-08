import type { Metadata } from "next";
import Link from "next/link";
import { PHASE0_CITY_PAGES, citiesByPriority, formatIndianNumber, getState, netCost, rupees, subsidyBreakdown, systemCost } from "@/data/solar-engine";
import { EXAMPLE_KW } from "@/lib/pages";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Container, Prose, TableWrap, Td, Th } from "@/components/ui";

const TITLE = "Solar Panel Price in India 2026 — City by City";
const DESCRIPTION =
  "What a rooftop solar system costs in 40 Indian cities: installed price, subsidy, what you pay after it, and how many units your roof will actually generate there.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/solar-panel-price" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Solar price" }];

export default function PriceIndexPage() {
  const cities = citiesByPriority(PHASE0_CITY_PAGES);

  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Solar panel price in India, city by city</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          Hardware costs roughly the same everywhere; what changes the answer is sunshine and tariffs. A {EXAMPLE_KW} kW
          roof in Jaipur generates about a fifth more than the same roof in Kolkata, and the value of each unit varies
          more than that again. Figures are for a {EXAMPLE_KW} kW system.
        </p>
      </Prose>

      <div className="mt-6">
        <TableWrap>
          <thead>
            <tr>
              <Th>City</Th>
              <Th>State</Th>
              <Th align="right">Installed</Th>
              <Th align="right">You pay</Th>
              <Th align="right">Units / year</Th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => {
              const subsidy = subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug: c.stateSlug }).total;
              return (
                <tr key={c.slug}>
                  <Td strong>
                    <Link href={`/solar-panel-price/${c.slug}`} className="text-[var(--accent)] hover:underline">
                      {c.name}
                    </Link>
                  </Td>
                  <Td>{getState(c.stateSlug)?.name}</Td>
                  <Td align="right">{rupees(systemCost(EXAMPLE_KW, c.stateSlug).gross)}</Td>
                  <Td align="right" strong>
                    {rupees(netCost(EXAMPLE_KW, subsidy, c.stateSlug))}
                  </Td>
                  <Td align="right">{formatIndianNumber(EXAMPLE_KW * c.kwhPerKwpYear)}</Td>
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
