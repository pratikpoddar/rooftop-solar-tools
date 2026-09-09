import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATES, citiesInState, formatIndianNumber, getNetMeteringRule, getStateTopUp, rupees, statesByPriority } from "@/data/solar-engine";
import { buildStateSubsidyPage, EXAMPLE_KW } from "@/lib/pages";
import { breadcrumbSchema, faqSchema, howToSchema, jsonLd } from "@/lib/schema";
import { ToolMount } from "@/components/tools/ToolMount";
import {
  Breadcrumbs,
  Callout,
  Card,
  Container,
  Disclaimer,
  LinkList,
  NoteList,
  Prose,
  SectionHeading,
  TableWrap,
  Td,
  Th,
  VerifiedStamp,
} from "@/components/ui";

/** Every state and UT gets a page — 36 in Phase 0, English only (spec §9). */
export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const page = buildStateSubsidyPage(state);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/solar-subsidy/${state}` },
    openGraph: {
      title: page.title,
      description: page.description,
      images: [
        {
          url: `/api/og?kind=subsidy&value=${page.total}&value2=${page.worked.net}&place=${encodeURIComponent(page.state.name)}&kw=${EXAMPLE_KW}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function StateSubsidyPage({ params }: Props) {
  const { state: slug } = await params;
  const page = buildStateSubsidyPage(slug);
  if (!page) notFound();

  const topUp = getStateTopUp(slug);
  const rule = getNetMeteringRule(slug);
  const cities = citiesInState(slug).slice(0, 6);
  const nearbyStates = statesByPriority()
    .filter((s) => s.slug !== slug)
    .slice(0, 6);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Solar subsidy", href: "/solar-subsidy" },
    { label: page.state.name },
  ];

  const howToSteps = [
    { name: "Register on the national portal", text: "Create an account on pmsuryaghar.gov.in with your DISCOM consumer number and apply for feasibility approval." },
    { name: "Get feasibility approval", text: "Your DISCOM checks that your sanctioned load and transformer capacity can take the system. This usually takes one to two weeks." },
    { name: "Install through an empanelled vendor", text: "The subsidy is only released for systems installed by a vendor empanelled with your DISCOM, using models on the ALMM list." },
    { name: "Apply for the net meter and inspection", text: "After installation, submit the commissioning request. The DISCOM inspects and fits a bidirectional net meter." },
    ...(topUp?.separateApplication && topUp.applicationPortal
      ? [{ name: `Apply separately to ${topUp.agency}`, text: `The national portal releases the central subsidy only. Submit the state top-up application at ${topUp.applicationPortal}${topUp.conditions.some((c) => c.includes("45 days")) ? " within 45 days of commissioning" : ""}.` }]
      : []),
    { name: "Submit bank details for the subsidy", text: "Once the net meter is installed and the commissioning certificate is issued, upload your bank details on the portal. The subsidy is paid by direct transfer, typically within 30 days." },
  ];

  return (
    <Container className="py-8">
      <Breadcrumbs trail={trail} />

      <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{page.h1}</h1>
      <Prose>
        <p className="mt-3">{page.lede}</p>
      </Prose>
      <VerifiedStamp date={page.lastVerified} confidence={page.confidence} className="mt-3" />

      {page.provisionalTopUp && topUp?.applicationPortal ? (
        <Callout tone="warn" className="mt-4" title={`The ${topUp.agency} half is budget-dependent`}>
          <p>
            The central PM Surya Ghar subsidy is a firm entitlement.
            The state top-up on top of it depends on {page.state.name}&apos;s budget allocation, has changed terms
            before, and pauses when the allocation is exhausted.
          </p>
          <p>
            <a
              href={topUp.applicationPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--accent)] underline underline-offset-2"
            >
              Check current availability with {topUp.agency} →
            </a>
          </p>
        </Callout>
      ) : null}

      {/* Subsidy by size */}
      <section className="mt-8">
        <SectionHeading>Subsidy by system size in {page.state.name}</SectionHeading>
        <TableWrap>
          <thead>
            <tr>
              <Th>Size</Th>
              <Th align="right">Central</Th>
              <Th align="right">{topUp?.agency ? "State top-up" : "State"}</Th>
              <Th align="right">Total subsidy</Th>
              <Th align="right">System cost</Th>
              <Th align="right">You pay</Th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map((r) => (
              <tr key={r.size}>
                <Td strong nowrap>
                  {r.size}
                </Td>
                <Td align="right">{r.central}</Td>
                <Td align="right">{r.topUp}</Td>
                <Td align="right" strong>
                  {r.total}
                </Td>
                <Td align="right">{r.cost}</Td>
                <Td align="right" strong>
                  {r.net}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <Disclaimer className="mt-3" />
      </section>

      {/* Eligibility and conditions */}
      <section className="mt-8">
        <SectionHeading>Who is eligible</SectionHeading>
        <div className="mt-3 space-y-3">
          <NoteList
            notes={[
              "You own the roof, or have the owner's written consent.",
              "The connection is a residential (domestic) one with your DISCOM.",
              "No previous central subsidy has been claimed for the same premises.",
              "You have a bank account for the direct transfer, and the installation is done by a DISCOM-empanelled vendor.",
            ]}
          />
          {topUp && topUp.topUpType !== "none" ? (
            <Callout tone="warn" title={`${topUp.agency} conditions`}>
              <NoteList notes={topUp.conditions} />
              <VerifiedStamp date={topUp.lastVerified} confidence={topUp.confidence} className="mt-2" />
            </Callout>
          ) : null}
        </div>
      </section>

      {/* Worked example */}
      <section className="mt-8">
        <SectionHeading>
          A worked {EXAMPLE_KW} kW example on {page.worked.discomName}
        </SectionHeading>
        <Card tone="soft" className="mt-3 p-4">
          <Prose>
            <p>
              Take a household in {page.state.name} using <strong>{page.worked.units} units a month</strong> — a bill of
              about <strong>{rupees(page.worked.bill)}</strong> on {page.worked.discomName}&apos;s domestic tariff.
            </p>
            <p>
              At {formatIndianNumber(page.worked.kwhPerKwp)} kWh per kWp a year, a {page.worked.kw} kW system generates
              roughly <strong>{formatIndianNumber(page.worked.annualKwh)} units annually</strong>. After the{" "}
              {rupees(page.total)} subsidy the system costs <strong>{rupees(page.worked.net)}</strong> and cuts the
              bill by about <strong>{rupees(page.worked.monthlyBillSaving)} a month</strong> in year one
              {page.worked.monthlyExportIncome > 0
                ? `, with a further ${rupees(page.worked.monthlyExportIncome)} a month paid for surplus units exported to the grid.`
                : "."}{" "}
              It pays for itself in <strong>{page.worked.payback}</strong>, and over 25 years comes to about{" "}
              <strong>{page.worked.lifetime}</strong>.
            </p>
            <p>
              Financed instead of paid for in cash, the EMI on {rupees(Math.min(page.worked.net, 200000))} over ten
              years at 7.15% is about <strong>{rupees(page.worked.emi)} a month</strong> — set that against the{" "}
              {rupees(page.worked.bill)} bill it replaces.
            </p>
          </Prose>
        </Card>
      </section>

      {rule?.gotchas.length ? (
        <section className="mt-8">
          <SectionHeading>
            {page.state.name} net-metering rules that change the maths
          </SectionHeading>
          <Callout tone="warn" className="mt-3">
            <NoteList notes={rule.gotchas} />
          </Callout>
          <VerifiedStamp date={rule.lastVerified} confidence={rule.confidence} className="mt-2" />
        </section>
      ) : null}

      {/* The embedded calculator — the thing content-only competitors cannot copy */}
      <section className="mt-10 scroll-mt-16" id="calculator">
        <ToolMount kind="subsidy" sourcePage={`/solar-subsidy/${slug}`} fallback={{ stateSlug: slug, kw: EXAMPLE_KW }} />
      </section>

      {/* How to apply */}
      <section className="mt-10">
        <SectionHeading>How to apply in {page.state.name}</SectionHeading>
        <ol className="mt-3 space-y-3">
          {howToSteps.map((step, i) => (
            <li key={step.name} className="flex gap-3">
              <span className="nums mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-inset)] text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.name}</p>
                <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <SectionHeading>Solar subsidy in {page.state.name} — questions</SectionHeading>
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
        {cities.length ? (
          <LinkList
            title={`Solar prices in ${page.state.name}`}
            links={cities.map((c) => ({ href: `/solar-panel-price/${c.slug}`, label: c.name }))}
          />
        ) : null}
        <LinkList
          title="Subsidy in other states"
          links={nearbyStates.map((s) => ({ href: `/solar-subsidy/${s.slug}`, label: s.name }))}
        />
        <LinkList
          title="Work out your own numbers"
          links={[
            { href: `/tools/bill-to-size?state=${slug}`, label: "What size do I need?" },
            { href: `/tools/savings-payback?state=${slug}`, label: "25-year savings" },
            { href: `/tools/loan-emi?state=${slug}`, label: "Loan EMI" },
          ]}
        />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(page.faqs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          howToSchema({
            name: `How to apply for the rooftop solar subsidy in ${page.state.name}`,
            description: page.description,
            steps: howToSteps,
          }),
        )}
      />
    </Container>
  );
}
