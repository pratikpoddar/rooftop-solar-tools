import type { Metadata } from "next";
import Link from "next/link";
import { RESIDENTIAL_CFA_CAP, getStateTopUp, rupees, statesByPriority, subsidyBreakdown } from "@/data/solar-engine";
import { EXAMPLE_KW } from "@/lib/pages";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Container, Prose, SectionHeading, TableWrap, Td, Th } from "@/components/ui";

const TITLE = "Solar Subsidy by State 2026 — PM Surya Ghar + State Top-Ups";
const DESCRIPTION =
  "Every state's rooftop solar subsidy in one table: the central PM Surya Ghar amount, the state top-up where one exists, and what a 3 kW system costs after both.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/solar-subsidy" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Solar subsidy" }];

export default function SubsidyIndexPage() {
  const rows = statesByPriority().map((state) => {
    const s = subsidyBreakdown({ kw: EXAMPLE_KW, stateSlug: state.slug });
    const topUp = getStateTopUp(state.slug);
    return {
      state,
      central: s.central,
      topUpValue:
        s.stateCapital > 0
          ? rupees(s.stateCapital)
          : topUp?.topUpType === "generation"
            ? "Per-unit incentive"
            : topUp?.varies
              ? "Varies by income"
              : "—",
      total: s.total,
      agency: topUp?.agency,
    };
  });

  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Solar subsidy by state, 2026</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          The central subsidy is identical everywhere: {rupees(30000)} per kW for the first 2 kW, {rupees(18000)} for
          the third, capped at {rupees(RESIDENTIAL_CFA_CAP)}. What differs is the state top-up — six states add money,
          most do not, and two of those six pay it in a form that is not a discount on your invoice. Figures below are
          for a {EXAMPLE_KW} kW residential system.
        </p>
      </Prose>

      <div className="mt-6">
        <TableWrap>
          <thead>
            <tr>
              <Th>State / UT</Th>
              <Th align="right">Central</Th>
              <Th>State top-up</Th>
              <Th align="right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.state.slug}>
                <Td strong>
                  <Link href={`/solar-subsidy/${r.state.slug}`} className="text-[var(--accent)] hover:underline">
                    {r.state.name}
                  </Link>
                </Td>
                <Td align="right">{rupees(r.central)}</Td>
                <Td>
                  <span>{r.topUpValue}</span>
                  {r.agency ? <span className="block text-xs text-[var(--fg-subtle)]">{r.agency}</span> : null}
                </Td>
                <Td align="right" strong>
                  {rupees(r.total)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <section className="mt-8">
        <SectionHeading>Why the total is not always central plus top-up</SectionHeading>
        <Prose>
          <p className="mt-2">
            Delhi pays a generation-based incentive per unit produced over 24 months rather than a capital top-up, so it
            never reduces the invoice. Haryana and Madhya Pradesh link the amount to household income and publish no
            single figure. In all three cases we show the central subsidy as the total and describe the rest separately,
            rather than quoting a number you might not receive.
          </p>
        </Prose>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
