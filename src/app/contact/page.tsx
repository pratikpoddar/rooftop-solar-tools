import type { Metadata } from "next";
import Link from "next/link";
import { NATIONAL_PORTAL } from "@/lib/site";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Card, Container, Prose, SectionHeading } from "@/components/ui";
import { ContactLine } from "@/components/ContactLine";

const TITLE = "Contact";
const DESCRIPTION = "How to reach us about a wrong number, a data request, an installer complaint, or a partnership.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Contact" }];

const REASONS = [
  {
    title: "A number here is wrong",
    body: "The most useful message you can send. Tell us the page and what it should say, ideally with the tariff order or scheme notification. Subsidy and tariff data goes stale by design — state schemes pause when their budget runs out — so corrections are how this stays trustworthy.",
  },
  {
    title: "Delete or correct my details",
    body: "If you asked for quotes and want that undone, say so and we will delete the record. You can also ask what we hold and who we shared it with. Your rights are set out in the privacy policy.",
  },
  {
    title: "An installer you introduced behaved badly",
    body: "We want to know. We check empanelment before introducing anyone, but we do not supervise their work, and this feedback decides who we keep introducing.",
  },
  {
    title: "I install solar and want to receive enquiries",
    body: "Tell us your DISCOM or MNRE empanelment ID and the PIN codes you cover. We route by city, cap at three installers per enquiry, and charge on completed installations rather than per lead.",
  },
];

export default function ContactPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Contact</h1>
      <Prose>
        <p className="mt-3">
          <ContactLine purpose="anything below" />
        </p>
      </Prose>

      <div className="mt-6 space-y-3">
        {REASONS.map((r) => (
          <Card key={r.title} tone="soft" className="p-4">
            <SectionHeading as="h2">{r.title}</SectionHeading>
            <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">{r.body}</p>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <SectionHeading>What we cannot help with</SectionHeading>
        <Prose>
          <p className="mt-2">
            We are not the government and we are not your DISCOM. We cannot check your subsidy application status,
            release a payment, escalate a net-meter delay, or change a decision. Those all go through the{" "}
            <a href={NATIONAL_PORTAL} target="_blank" rel="noopener noreferrer">
              PM Surya Ghar national portal
            </a>{" "}
            or your electricity board.
          </p>
          <p>
            We also cannot tell you whether a specific quote is fair beyond what the{" "}
            <Link href="/solar-panel-price">city price pages</Link> already show — that is exactly why those pages
            publish the market range.
          </p>
        </Prose>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
