import type { Metadata } from "next";
import Link from "next/link";
import {
  RESIDENTIAL_CFA_CAP,
  citiesByPriority,
  formatIndianNumber,
  rupees,
  statesByPriority,
  systemCost,
  subsidyBreakdown,
} from "@/data/solar-engine";
import { SubsidyCalculator } from "@/components/tools/SubsidyCalculator";
import { Card, Container, LinkList, Prose, SectionHeading, Stat, StatGrid } from "@/components/ui";
import { faqSchema, jsonLd } from "@/lib/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/api/og?kind=savings&value=218000&place=India&kw=3", width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    q: "How much subsidy do I get for rooftop solar in India?",
    a: `Under PM Surya Ghar you get Rs 30,000 per kW for the first 2 kW and Rs 18,000 for the third kW, capped at Rs ${formatIndianNumber(RESIDENTIAL_CFA_CAP)} for any residential system above 3 kW. Several states add a top-up on top of that — Gujarat adds Rs 10,000, Uttar Pradesh up to Rs 30,000.`,
  },
  {
    q: "What does a 3 kW rooftop solar system cost in India?",
    a: `About Rs ${formatIndianNumber(systemCost(3).gross)} installed, within a typical range of Rs ${formatIndianNumber(systemCost(3).grossMin)} to Rs ${formatIndianNumber(systemCost(3).grossMax)} depending on your city, panel brand and roof. After the Rs ${formatIndianNumber(subsidyBreakdown({ kw: 3, stateSlug: "maharashtra" }).total)} central subsidy you pay roughly Rs ${formatIndianNumber(systemCost(3).gross - 78000)}.`,
  },
  {
    q: "Is rooftop solar worth it?",
    a: "In most of India a correctly sized system pays for itself in three to six years and then runs for another twenty. It is worth much less in states that run net billing rather than net metering, such as Uttar Pradesh and Tamil Nadu, because exported units are bought at a wholesale rate rather than credited against your tariff. Our savings calculator applies your state's actual rule.",
  },
  {
    q: "Can I get a loan for rooftop solar?",
    a: "Yes. PM Surya Ghar makes rooftop loans collateral-free up to Rs 2 lakh at around 7 to 7.4 percent, with tenures up to ten years. For a typical 3 kW system the EMI is usually smaller than the electricity bill it replaces.",
  },
];

export default function HomePage() {
  const topStates = statesByPriority().slice(0, 10);
  const topCities = citiesByPriority(12);

  return (
    <Container className="py-8 sm:py-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          What rooftop solar <span className="text-[var(--accent)]">actually</span> costs you
        </h1>
        <Prose>
          <p className="mt-3 max-w-2xl text-base">
            Every installer&apos;s website is a sales page. This is the arithmetic: what the government pays you, what
            you pay, what you save, and how long it takes — for your state, your city and your electricity board. Free,
            no signup, nothing sold.
          </p>
        </Prose>

        <StatGrid cols={3}>
          <div className="mt-6 contents">
            <Stat label="Central subsidy, up to" value={rupees(RESIDENTIAL_CFA_CAP)} sub="PM Surya Ghar" />
            <Stat label="Cities with local figures" value="100" sub="generation and tariffs" />
            <Stat label="States and UTs covered" value="36" sub="subsidy and net metering" />
          </div>
        </StatGrid>
      </section>

      <SubsidyCalculator sourcePage="/" />

      <div className="mt-12 space-y-8">
        <LinkList
          title="Subsidy by state"
          links={topStates.map((s) => ({ href: `/solar-subsidy/${s.slug}`, label: s.name }))}
        />
        <LinkList
          title="Price by city"
          links={topCities.map((c) => ({ href: `/solar-panel-price/${c.slug}`, label: c.name }))}
        />

        <Card tone="soft" className="p-4 sm:p-5">
          <SectionHeading>The other three calculators</SectionHeading>
          <ul className="mt-3 space-y-3 text-sm">
            {[
              { href: "/tools/bill-to-size", title: "What size solar do I need?", body: "Your bill tells you the size. It also tells you the roof area you need." },
              { href: "/tools/savings-payback", title: "Is solar worth it? 25-year savings", body: "Year-one saving, payback, and what your state's net-metering rule does to the maths." },
              { href: "/tools/loan-emi", title: "Solar loan EMI", body: "Collateral-free up to Rs 2 lakh. Compare five banks against the bill you already pay." },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group block">
                  <span className="font-semibold text-[var(--accent)] group-hover:underline">{item.title} →</span>
                  <span className="block text-[var(--fg-muted)]">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <section>
          <SectionHeading>Common questions</SectionHeading>
          <dl className="mt-3 divide-y divide-[var(--line)]">
            {FAQS.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(FAQS))} />
    </Container>
  );
}
