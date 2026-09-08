import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Card, Container, Prose, SectionHeading } from "@/components/ui";

const TITLE = "Free Rooftop Solar Calculators for India";
const DESCRIPTION =
  "Four free calculators: PM Surya Ghar subsidy, the system size your bill implies, 25-year savings and payback, and solar loan EMI.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Tools" }];

const TOOLS = [
  {
    href: "/tools/subsidy-calculator",
    title: "PM Surya Ghar subsidy calculator",
    body: "Central subsidy plus your state's top-up, and what is left for you to pay. Handles housing societies, BPL enhancements and income ceilings.",
  },
  {
    href: "/tools/bill-to-size",
    title: "What size solar do I need?",
    body: "Turns your bill or your units into a kW figure, the roof area it needs, and the cost after subsidy — capped at your sanctioned load.",
  },
  {
    href: "/tools/savings-payback",
    title: "Savings and payback over 25 years",
    body: "Year-one saving, payback, and the full 25-year curve, with your state's net-metering or net-billing rule applied to exported units.",
  },
  {
    href: "/tools/loan-emi",
    title: "Solar loan EMI",
    body: "Five banks compared on the collateral-free PM Surya Ghar loan, with the EMI set against the electricity bill it replaces.",
  },
];

export default function ToolsPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">The calculators</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          All four read from the same numbers engine, so a figure you see in one matches the others. Free, no signup,
          nothing stored unless you ask us for installer quotes.
        </p>
      </Prose>

      <div className="mt-6 space-y-3">
        {TOOLS.map((t) => (
          <Card key={t.href} tone="soft" className="p-4">
            <Link href={t.href} className="group block">
              <SectionHeading as="h2" className="text-[var(--accent)] group-hover:underline">
                {t.title} →
              </SectionHeading>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{t.body}</p>
            </Link>
          </Card>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
