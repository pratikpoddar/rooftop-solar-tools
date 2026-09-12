import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatIndianNumber, rupees } from "@/data/solar-engine";
import { buildComparison, comparisonPairs, parsePairSlug } from "@/lib/compare";
import { EXAMPLE_KW, EXAMPLE_UNITS } from "@/lib/pages";
import { breadcrumbSchema, faqSchema, jsonLd } from "@/lib/schema";
import { ToolMount } from "@/components/tools/ToolMount";
import { CompareShare } from "@/components/CompareShare";
import {
  Breadcrumbs,
  Callout,
  Container,
  Disclaimer,
  LinkList,
  Prose,
  SectionHeading,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";

export function generateStaticParams() {
  return comparisonPairs().map((p) => ({ pair: p.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ pair: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePairSlug(pair);
  if (!parsed) return {};
  const c = buildComparison(parsed.a, parsed.b);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      images: [
        {
          url: `/api/og?kind=compare&value=${c.a.paybackYears}&value2=${c.b.paybackYears}&place=${encodeURIComponent(c.a.city.name)}&place2=${encodeURIComponent(c.b.city.name)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

function Row({ label, a, b, note }: { label: string; a: string; b: string; note?: string }) {
  return (
    <tr>
      <Td strong>
        {label}
        {note ? <span className="mt-0.5 block text-xs font-normal text-[var(--fg-subtle)]">{note}</span> : null}
      </Td>
      <Td align="right">{a}</Td>
      <Td align="right">{b}</Td>
    </tr>
  );
}

export default async function ComparePage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePairSlug(pair);
  if (!parsed) notFound();
  const c = buildComparison(parsed.a, parsed.b);
  if (!c) notFound();

  const { a, b } = c;
  const trail = [
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare" },
    { label: `${a.city.name} vs ${b.city.name}` },
  ];

  const faqs = [
    {
      q: `Is rooftop solar better in ${a.city.name} or ${b.city.name}?`,
      a: c.verdict,
    },
    {
      q: `Does the subsidy differ between ${a.city.name} and ${b.city.name}?`,
      a:
        a.subsidy === b.subsidy
          ? `No. Both get ${rupees(a.subsidy)} on a ${EXAMPLE_KW} kW system. The central PM Surya Ghar amount is identical nationwide, and neither state adds a top-up that changes the total.`
          : `Yes. A ${EXAMPLE_KW} kW system gets ${rupees(a.subsidy)} in ${a.city.name} against ${rupees(b.subsidy)} in ${b.city.name}. The central amount is the same everywhere; the difference is the state top-up.`,
    },
    {
      q: `Which city generates more solar power, ${a.city.name} or ${b.city.name}?`,
      a: `${a.city.name} averages about ${formatIndianNumber(a.kwhPerKwp)} kWh per kWp a year and ${b.city.name} about ${formatIndianNumber(b.kwhPerKwp)}. On a ${EXAMPLE_KW} kW system that is ${formatIndianNumber(a.annualUnits)} units a year against ${formatIndianNumber(b.annualUnits)}.`,
    },
  ];

  const cheaperBill = a.effectiveRate >= b.effectiveRate ? a : b;

  return (
    <Container className="py-8">
      <Breadcrumbs trail={trail} />
      <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{c.h1}</h1>
      <Prose>
        <p className="mt-3">{c.verdict}</p>
      </Prose>

      <Callout tone="good" className="mt-4" title={`${c.winner.city.name} pays back sooner`}>
        <p>
          {c.winner.city.name} {c.winner.paybackLabel} · {c.loser.city.name} {c.loser.paybackLabel}
        </p>
      </Callout>

      <section className="mt-8">
        <SectionHeading>Side by side, on the same {EXAMPLE_KW} kW system</SectionHeading>
        <TableWrap>
          <thead>
            <tr>
              <Th>&nbsp;</Th>
              <Th align="right">{a.city.name}</Th>
              <Th align="right">{b.city.name}</Th>
            </tr>
          </thead>
          <tbody>
            <Row label="State" a={a.stateName} b={b.stateName} />
            <Row label="Installed cost" a={rupees(a.grossCost)} b={rupees(b.grossCost)} />
            <Row label="Subsidy" a={rupees(a.subsidy)} b={rupees(b.subsidy)} note="central plus any state top-up" />
            <Row label="You pay" a={rupees(a.net)} b={rupees(b.net)} />
            <Row
              label="Generation"
              a={`${formatIndianNumber(a.kwhPerKwp)} kWh/kWp`}
              b={`${formatIndianNumber(b.kwhPerKwp)} kWh/kWp`}
              note="per year"
            />
            <Row
              label="Units a year"
              a={formatIndianNumber(a.annualUnits)}
              b={formatIndianNumber(b.annualUnits)}
            />
            <Row
              label="Effective tariff"
              a={`Rs ${a.effectiveRate}`}
              b={`Rs ${b.effectiveRate}`}
              note="per unit, at 300 units a month"
            />
            <Row label="Bill today" a={rupees(a.bill)} b={rupees(b.bill)} note={`at ${EXAMPLE_UNITS} units a month`} />
            <Row label="Saving" a={`${rupees(a.monthlySaving)}/mo`} b={`${rupees(b.monthlySaving)}/mo`} />
            <Row label="Pays back in" a={a.paybackLabel} b={b.paybackLabel} />
            <Row label="25-year saving" a={a.lifetimeLabel} b={b.lifetimeLabel} />
          </tbody>
        </TableWrap>
        <Disclaimer className="mt-3" />
      </section>

      <section className="mt-8">
        <SectionHeading>Why they differ</SectionHeading>
        <Prose>
          <p className="mt-2">
            Panels and inverters cost roughly the same across India, so a comparison like this is really about three
            things: how much sun the roof gets, what a unit of grid electricity costs, and whether the state adds
            anything to the central subsidy.
          </p>
          <p>
            {cheaperBill.city.name} has the more expensive electricity at about Rs {cheaperBill.effectiveRate} a unit,
            which counterintuitively makes solar <em>more</em> worthwhile there — every unit your roof produces is a
            unit you do not buy at that price. A sunnier city with cheap power can pay back slower than a duller one
            with expensive power.
          </p>
        </Prose>
      </section>

      <CompareShare
        aName={a.city.name}
        bName={b.city.name}
        aPayback={a.paybackYears}
        bPayback={b.paybackYears}
        winner={c.winner.city.name}
        winnerPayback={c.winner.paybackLabel}
        slug={c.slug}
      />

      <section className="mt-10" id="calculator">
        <SectionHeading className="mb-3">Run it for your own bill</SectionHeading>
        <ToolMount
          kind="savings"
          sourcePage={`/compare/${c.slug}`}
          fallback={{ stateSlug: a.city.stateSlug, citySlug: a.city.slug, discomId: a.city.discomId, kw: EXAMPLE_KW }}
        />
      </section>

      <section className="mt-10">
        <SectionHeading>Questions</SectionHeading>
        <dl className="mt-3 divide-y divide-[var(--line)]">
          {faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 space-y-6">
        <LinkList
          title="These cities on their own"
          links={[
            { href: `/solar-panel-price/${a.city.slug}`, label: `Solar price in ${a.city.name}` },
            { href: `/solar-panel-price/${b.city.slug}`, label: `Solar price in ${b.city.name}` },
          ]}
        />
        <LinkList
          title="Other comparisons"
          links={comparisonPairs()
            .filter((p) => p.slug !== c.slug)
            .slice(0, 8)
            .map((p) => ({
              href: `/compare/${p.slug}`,
              label: `${label(p.a)} vs ${label(p.b)}`,
            }))}
        />
        <p className="text-sm">
          <Link href="/compare" className="font-medium text-[var(--accent)] underline underline-offset-2">
            All city comparisons →
          </Link>
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(faqs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
    </Container>
  );
}

function label(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
