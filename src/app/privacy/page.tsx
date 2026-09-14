import type { Metadata } from "next";
import Link from "next/link";
import { en } from "@/i18n/en";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { SITE, absoluteUrl } from "@/lib/site";
import { Breadcrumbs, Callout, Container, Prose, SectionHeading, TableWrap, Td, Th } from "@/components/ui";
import { ContactLine } from "@/components/ContactLine";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "What personal data this site collects, why, who it goes to, how long it is kept, and how to have it corrected or deleted.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Privacy" }];

/** Fields the lead API actually accepts — kept in step with src/app/api/lead/route.ts. */
const COLLECTED: { field: string; why: string }[] = [
  { field: "Your name", why: "So the installer who calls you knows who they are speaking to." },
  { field: "Your mobile number", why: "It is how an installer reaches you. This is the only way we can fulfil the request." },
  { field: "PIN code, city and state", why: "To match you with installers who actually work in your area." },
  { field: "System size and monthly bill", why: "So an installer can quote without making you repeat the whole conversation." },
  { field: "Which calculator you used, and the page you were on", why: "So we can tell which tools produce useful enquiries and fix the ones that do not." },
  { field: "Language preference", why: "So you are contacted in the language you were reading in." },
  { field: "The exact consent wording you agreed to, and when", why: "So what you actually agreed to is a matter of record rather than our recollection." },
];

export default function PrivacyPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Privacy policy</h1>
      <Prose>
        <p className="mt-3">
          Short version: the calculators need nothing from you, and we ask for your details in exactly one place — when
          you request installer quotes. If you do, your name and phone number go to up to three installers so they can
          call you. We do not sell your data, to anyone, ever.
        </p>
      </Prose>

      <section className="mt-8">
        <SectionHeading>Using the calculators collects nothing personal</SectionHeading>
        <Prose>
          <p className="mt-2">
            Every calculation runs in your browser or is prerendered. There is no account, no login, and we do not store
            your bill amount, your consumption, your city or your results. Nothing you type into a calculator is sent to
            us unless you press the quotes button.
          </p>
          <p>
            Sharing a result creates a link and an image containing only the numbers on your card — a rupee figure, a
            system size, and a city name. No name, no phone number, and nothing that identifies you.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>What we collect when you ask for quotes</SectionHeading>
        <TableWrap>
          <thead>
            <tr>
              <Th>What</Th>
              <Th>Why</Th>
            </tr>
          </thead>
          <tbody>
            {COLLECTED.map((row) => (
              <tr key={row.field}>
                <Td strong>{row.field}</Td>
                <Td>{row.why}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <Prose>
          <p className="mt-3">
            The consent checkbox is unticked when the page loads and the form will not submit without it. The wording
            you are agreeing to is:
          </p>
        </Prose>
        <Callout className="mt-2">
          <p className="italic">&ldquo;{en.lead.consent}&rdquo;</p>
        </Callout>
      </section>

      <section className="mt-8">
        <SectionHeading>Who it goes to</SectionHeading>
        <Prose>
          <p className="mt-2">
            Up to three rooftop solar installers in your area, drawn from those empanelled with your DISCOM or MNRE, so
            they can contact you about a quote. That is the entire purpose, and it is the only sharing that happens.
          </p>
          <p>
            We may also introduce you to a bank offering PM Surya Ghar rooftop loans, but only if you separately ask us
            to. We are paid by installers and banks when a deal completes — not per enquiry, and never for the data
            itself.
          </p>
          <p>
            <strong>We do not sell personal data.</strong> Not to data brokers, not to advertisers, not as a list. This
            is a fixed rule for this product, not a current policy that might change: the tools spread only as long as
            people trust them.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Where it is stored, and for how long</SectionHeading>
        <Prose>
          <p className="mt-2">
            Enquiries are stored in a private spreadsheet on Google Workspace, accessible only to the people running
            this site. Google acts as our processor and the data sits on their infrastructure.
          </p>
          <p>
            We keep an enquiry for <strong>24 months</strong>, which covers the installation cycle and the follow-up
            asking whether you went ahead. Within 90 days we also use your phone number to avoid handing the same
            enquiry to installers twice. After 24 months the record is deleted. Ask us sooner and we will delete it
            sooner.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Analytics, and why there are no cookies</SectionHeading>
        <Prose>
          <p className="mt-2">
            We use GoatCounter to count page views and which calculators get completed. It records the page you were
            on, roughly where in the world the request came from, and your browser — and nothing else. It sets{" "}
            <strong>no cookies</strong>, stores no personal data, and cannot follow you to any other site.
          </p>
          <p>
            That means we cannot tell one visitor from another across visits, and we could not link your browsing to
            your enquiry even if we wanted to. There are no advertising cookies, no ad networks and no cross-site
            trackers. The site stores nothing on your device.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Your rights</SectionHeading>
        <Prose>
          <p className="mt-2">
            Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask us to:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>tell you what we hold about you, and who we shared it with;</li>
            <li>correct or complete anything that is wrong;</li>
            <li>erase it, unless we are required to keep it;</li>
            <li>withdraw your consent — which stops any further sharing, though we cannot un-ring a call an installer has already made;</li>
            <li>nominate someone to exercise these rights if you are unable to.</li>
          </ul>
          <p>
            <ContactLine purpose="a data request or a complaint" />
          </p>
          <p>
            If we do not resolve your complaint, you can escalate it to the Data Protection Board of India.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Children</SectionHeading>
        <Prose>
          <p className="mt-2">
            This site is for adults arranging work on a property. We do not knowingly collect data from anyone under
            18. If you believe we have, tell us and we will delete it.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Changes</SectionHeading>
        <Prose>
          <p className="mt-2">
            If we change how we handle your data we will update this page. Material changes affecting existing
            enquiries will be sent to the people affected rather than quietly published here.
          </p>
          <p>
            See also our <Link href="/terms">terms of use</Link> and{" "}
            <Link href="/sources">where our numbers come from</Link>.
          </p>
        </Prose>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: absoluteUrl("/privacy"),
          publisher: { "@type": "Organization", name: SITE.name },
        })}
      />
    </Container>
  );
}
