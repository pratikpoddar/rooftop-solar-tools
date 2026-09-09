import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PHASE0_CITY_PAGES,
  citiesByPriority,
  citiesInState,
  formatIndianNumber,
  getDiscom,
  hasSlabTable,
  relatedCities,
  rupees,
} from "@/data/solar-engine";
import { buildCityPricePage, EXAMPLE_KW, EXAMPLE_UNITS } from "@/lib/pages";
import { breadcrumbSchema, faqSchema, jsonLd } from "@/lib/schema";
import { ToolMount } from "@/components/tools/ToolMount";
import { MonthlyGenerationChart } from "@/components/charts";
import { estimateGeneration } from "@/data/solar-engine";
import {
  Breadcrumbs,
  Callout,
  Card,
  Container,
  Disclaimer,
  LinkList,
  Prose,
  SectionHeading,
  Stat,
  StatGrid,
  TableWrap,
  Td,
  Th,
  VerifiedStamp,
} from "@/components/ui";

/** Phase 0 builds the top 40 cities; raise PHASE0_CITY_PAGES to 100 in Phase 1. */
export function generateStaticParams() {
  return citiesByPriority(PHASE0_CITY_PAGES).map((c) => ({ city: c.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const page = buildCityPricePage(city);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/solar-panel-price/${city}` },
    openGraph: {
      title: page.title,
      description: page.description,
      images: [
        {
          url: `/api/og?kind=savings&value=${Math.round(page.worked.monthlySaving * 12)}&place=${encodeURIComponent(page.city.name)}&kw=${EXAMPLE_KW}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function CityPricePage({ params }: Props) {
  const { city: slug } = await params;
  const page = buildCityPricePage(slug);
  if (!page) notFound();

  const discom = page.city.discomId ? getDiscom(page.city.discomId) : undefined;
  const gen = estimateGeneration({ kw: EXAMPLE_KW, citySlug: slug });
  const nearby = relatedCities(page.city, 3);
  const sameState = citiesInState(page.city.stateSlug)
    .filter((c) => c.slug !== slug)
    .slice(0, 6);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Solar price", href: "/solar-panel-price" },
    { label: page.city.name },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs trail={trail} />

      <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{page.h1}</h1>
      <Prose>
        <p className="mt-3">{page.lede}</p>
      </Prose>

      <StatGrid cols={3} className="mt-6">
          <Stat label={`${EXAMPLE_KW} kW after subsidy`} value={rupees(page.worked.net)} emphasis />
          <Stat label="Generation" value={`${formatIndianNumber(page.generation.kwhPerKwp)} kWh`} sub="per kWp per year" />
          <Stat label="Pays back in" value={page.worked.payback} sub={`on ${EXAMPLE_UNITS} units a month`} />
      </StatGrid>

      {/* Price table */}
      <section className="mt-8">
        <SectionHeading>Solar system prices in {page.city.name}, by size</SectionHeading>
        <TableWrap>
          <thead>
            <tr>
              <Th>Size</Th>
              <Th align="right">Market range</Th>
              <Th align="right">Typical</Th>
              <Th align="right">Subsidy</Th>
              <Th align="right">You pay</Th>
              <Th align="right">Units / year</Th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map((r) => (
              <tr key={r.size}>
                <Td strong nowrap>
                  {r.size}
                </Td>
                <Td align="right">{r.range}</Td>
                <Td align="right">{r.typical}</Td>
                <Td align="right">{r.subsidy}</Td>
                <Td align="right" strong>
                  {r.net}
                </Td>
                <Td align="right">{r.annualUnits}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <Prose>
          <p className="mt-3 text-sm">
            Ranges are for on-grid systems with tier-1 panels and GST included. Net-meter charges of {rupees(3000)}–
            {rupees(8000)} are usually billed separately, and a roof needing structural reinforcement adds{" "}
            {rupees(10000)}–{rupees(50000)}. Batteries are not included — they roughly double the cost and are only
            worth it if your supply is genuinely unreliable.
          </p>
        </Prose>
        <Disclaimer className="mt-3" />
      </section>

      {/* Generation profile */}
      <section className="mt-8">
        <SectionHeading>What a {EXAMPLE_KW} kW system generates in {page.city.name}</SectionHeading>
        <Card className="mt-3 p-4">
          <MonthlyGenerationChart monthlyKwh={gen.monthlyKwh} caption={false} />
        </Card>
        <Prose>
          <p className="mt-3 text-sm">
            {page.generation.peakMonth} is {page.city.name}&apos;s best month and {page.generation.troughMonth} its
            worst, at about {page.generation.troughPct}% of peak output. That dip is seasonal, not a fault — installers
            who promise flat monthly generation are overselling.
          </p>
        </Prose>
      </section>

      {/* Tariff and savings */}
      <section className="mt-8">
        <SectionHeading>What you save on {page.discomName}</SectionHeading>
        <Card tone="soft" className="mt-3 p-4">
          <Prose>
            <p>
              A {page.city.name} household using <strong>{page.worked.units} units a month</strong> pays about{" "}
              <strong>{rupees(page.worked.bill)}</strong> — an effective{" "}
              <strong>Rs {page.effectiveRate}/unit</strong> once fixed charges and electricity duty are counted.
            </p>
            <p>
              A {EXAMPLE_KW} kW system cuts that bill by about{" "}
              <strong>{rupees(page.worked.monthlyBillSaving)} a month</strong>
              {page.worked.monthlyExportIncome > 0
                ? ` and earns a further ${rupees(page.worked.monthlyExportIncome)} a month for the surplus units it exports`
                : ""}, which is about <strong>{page.worked.lifetime}</strong> over 25 years. For this consumption the
              right size is <strong>{page.worked.recommendedKw} kW</strong>.
            </p>
          </Prose>
        </Card>

        {discom && hasSlabTable(page.city.stateSlug) ? (
          <div className="mt-4">
            <SectionHeading as="h3" className="mb-2">
              {discom.name} domestic slabs
            </SectionHeading>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Units</Th>
                  <Th align="right">Rs / unit</Th>
                  <Th align="right">Cost of that slab in full</Th>
                </tr>
              </thead>
              <tbody>
                {discom.slabs.map((s) => (
                  <tr key={`${s.from}-${s.to}`}>
                    <Td strong nowrap>
                      {s.to === null ? `${s.from} and above` : `${s.from === 0 ? 1 : s.from}–${s.to}`}
                    </Td>
                    <Td align="right">{s.rate.toFixed(2)}</Td>
                    <Td align="right">
                      {s.to === null ? "—" : rupees((s.to - (s.from === 0 ? 0 : s.from - 1)) * s.rate)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Prose>
              <p className="mt-2 text-sm">
                Solar erases your most expensive slab first, which is why the saving per unit is higher than your
                average rate. Plus{" "}
                {discom.fixedChargePerKw ? `Rs ${discom.fixedCharge}/kW` : rupees(discom.fixedCharge)} a month in fixed
                charges, which solar does not remove
                {discom.electricityDutyPct > 0
                  ? `, and ${Math.round(discom.electricityDutyPct * 100)}% electricity duty on the energy charge.`
                  : "."}
              </p>
            </Prose>
            <VerifiedStamp date={discom.lastVerified} confidence={discom.confidence} className="mt-2" />
          </div>
        ) : discom ? (
          <Callout tone="warn" className="mt-4">
            <p>
              We do not yet have {discom.name}&apos;s full slab table, so the figures above use an average effective
              domestic rate of Rs {discom.slabs[0].rate}/unit for {page.state.name}. Treat the savings as indicative
              until we complete the slab pass for this state.
            </p>
          </Callout>
        ) : null}
      </section>

      {/* Embedded calculators */}
      <section className="mt-10" id="calculator">
        <ToolMount
          kind="savings"
          sourcePage={`/solar-panel-price/${slug}`}
          fallback={{ stateSlug: page.city.stateSlug, citySlug: slug, discomId: page.city.discomId, kw: EXAMPLE_KW }}
        />
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <SectionHeading>Solar in {page.city.name} — questions</SectionHeading>
        <dl className="mt-3 divide-y divide-[var(--line)]">
          {page.faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 space-y-6">
        <LinkList
          title={`${page.state.name} subsidy and nearby cities`}
          links={[
            { href: `/solar-subsidy/${page.city.stateSlug}`, label: `Subsidy in ${page.state.name}` },
            ...nearby.map((c) => ({ href: `/solar-panel-price/${c.slug}`, label: c.name })),
          ]}
        />
        {sameState.length ? (
          <LinkList
            title={`Other cities in ${page.state.name}`}
            links={sameState.map((c) => ({ href: `/solar-panel-price/${c.slug}`, label: c.name }))}
          />
        ) : null}
        <LinkList
          title="Work out your own numbers"
          links={[
            { href: `/tools/subsidy-calculator?city=${slug}`, label: "Subsidy calculator" },
            { href: `/tools/bill-to-size?city=${slug}`, label: "What size do I need?" },
            { href: `/tools/loan-emi?city=${slug}`, label: "Loan EMI" },
          ]}
        />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(page.faqs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
    </Container>
  );
}
