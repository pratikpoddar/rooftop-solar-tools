import type { Metadata } from "next";
import Link from "next/link";
import { ESTIMATE_DISCLAIMER } from "@/data/solar-engine";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Callout, Container, Prose, SectionHeading } from "@/components/ui";
import { ContactLine } from "@/components/ContactLine";

const TITLE = "Terms of Use";
const DESCRIPTION =
  "What these calculators are, what they are not, and the limits of what you should rely on them for.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Terms" }];

export default function TermsPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Terms of use</h1>
      <Prose>
        <p className="mt-3">
          These tools are free, and they are estimates. Read this if you are about to spend a lakh or more on the
          strength of a number you found here.
        </p>
      </Prose>

      <section className="mt-8">
        <SectionHeading>These are estimates, not quotes</SectionHeading>
        <Callout tone="warn" className="mt-3">
          <p>{ESTIMATE_DISCLAIMER}</p>
        </Callout>
        <Prose>
          <p className="mt-3">
            Every figure here is computed from published central and state subsidy rates, state regulator tariff
            orders, and regional solar generation data. Your actual outcome depends on things we cannot see: the shading
            on your roof, its structural condition, your sanctioned load, your DISCOM&apos;s feasibility decision, what
            hardware your installer actually fits, and whether a state scheme still has budget on the day you apply.
          </p>
          <p>
            We show a &ldquo;last verified&rdquo; date next to subsidy and tariff figures, and mark the ones we have not
            confirmed against a primary source as <strong>approximate</strong>. Take those seriously — some of our
            tariff tables are calibrated approximations rather than transcriptions of the tariff order.{" "}
            <Link href="/sources">Where our numbers come from</Link> sets out exactly what is verified and what is not.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>We are not your advisor</SectionHeading>
        <Prose>
          <p className="mt-2">
            Nothing here is financial, investment, tax or legal advice, and we are not licensed to give any of it. The
            loan calculator compares published interest rates; it is not a lending decision, an offer, or a
            pre-approval. Whether rooftop solar makes sense for you is your call, ideally after a site visit and a
            written quote.
          </p>
          <p>
            We do not sell, install, finance or maintain solar equipment, and we are not an agent of any installer,
            bank, DISCOM or government body. Where we mention a scheme, the government&apos;s own terms govern it, not
            ours.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Installer introductions</SectionHeading>
        <Prose>
          <p className="mt-2">
            If you ask for quotes, we pass your details to up to three installers so they can contact you. We check
            that they appear on a DISCOM or MNRE empanelment list, but we do not supervise their work, warrant their
            pricing, or become a party to whatever you agree with them. Your contract is with the installer.
          </p>
          <p>
            We are paid a referral fee by installers and banks when a deal completes. That is how the site stays free.
            It does not change the arithmetic — the calculators do not know who pays us, and the subsidy and tariff
            tables are the same for everyone.
          </p>
          <p>
            If an installer we introduced you to behaves badly, tell us. That feedback drives who we keep introducing.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Liability</SectionHeading>
        <Prose>
          <p className="mt-2">
            The site is provided as is. We take care with the numbers and correct errors when we find them, but we do
            not warrant that every figure is current or accurate, and we are not liable for decisions taken on the
            strength of an estimate. Where liability cannot be excluded under Indian law, it is limited to the amount
            you paid us — which is nothing.
          </p>
          <p>
            Found a wrong number? It is worth more to us to know than to look right.{" "}
            <ContactLine purpose="a correction" />
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Using the content</SectionHeading>
        <Prose>
          <p className="mt-2">
            Quote our figures, screenshot the calculators, forward the share cards — that is what they are for. Please
            link back so people can check their own numbers. Do not scrape the site wholesale, present our estimates as
            your own quotes, or imply we endorse you.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Governing law</SectionHeading>
        <Prose>
          <p className="mt-2">
            These terms are governed by the laws of India. See also our <Link href="/privacy">privacy policy</Link>,
            which covers what happens to your details if you ask for quotes.
          </p>
        </Prose>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
