import type { Metadata } from "next";
import { ENGINE_VERSION, SOURCES, SLAB_STATES, STATES, getState } from "@/data/solar-engine";
import { breadcrumbSchema, jsonLd } from "@/lib/schema";
import { Breadcrumbs, Container, Prose, SectionHeading, TableWrap, Td, Th } from "@/components/ui";

const TITLE = "Where Our Numbers Come From";
const DESCRIPTION =
  "Every source behind the subsidy, cost, generation, tariff, loan and net-metering figures on this site, and an honest account of what is verified and what is still approximate.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/sources" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Sources" }];

export default function SourcesPage() {
  const slabStates = SLAB_STATES.map((s) => getState(s)?.name).filter(Boolean);
  const flatStates = STATES.filter((s) => !SLAB_STATES.includes(s.slug)).length;

  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Where our numbers come from</h1>
      <Prose>
        <p className="mt-3 max-w-2xl">
          Quoting a subsidy that has run out is the fastest way to lose your trust, so every figure on the site carries
          a last-verified date and a badge saying whether it came from a primary source or is still a best-effort
          estimate. This page is the full list. Numbers engine v{ENGINE_VERSION}.
        </p>
      </Prose>

      <section className="mt-8">
        <SectionHeading>What is verified, and what is not</SectionHeading>
        <Prose>
          <p className="mt-2">
            <strong>Verified:</strong> the central PM Surya Ghar subsidy structure, the Gujarat, Uttar Pradesh and
            Rajasthan top-ups, the SBI, Canara and Union loan rates, and the net-metering mechanism in Gujarat, Uttar
            Pradesh, Tamil Nadu, Maharashtra, Bihar and Odisha.
          </p>
          <p>
            <strong>Approximate:</strong> the domestic tariff slab tables. We have full slab tables for{" "}
            {slabStates.length} states — {slabStates.join(", ")} — calibrated so their effective rates match published
            benchmarks, but not yet transcribed line by line from each SERC tariff order. The remaining {flatStates}{" "}
            states and UTs use a single average effective rate, which is enough to size a system but not to predict a
            bill to the rupee. Generation figures are regional averages from the MNRE Solar Atlas lineage, not a
            shading study of your roof.
          </p>
          <p>
            If a number on this site is wrong, it is worth more to us to know than to look right.{" "}
            <a href="mailto:hello@example.com">Tell us</a>.
          </p>
        </Prose>
      </section>

      <section className="mt-8">
        <SectionHeading>Sources</SectionHeading>
        <TableWrap>
          <thead>
            <tr>
              <Th>Dataset</Th>
              <Th>Source</Th>
            </tr>
          </thead>
          <tbody>
            {Object.values(SOURCES).map((s) => (
              <tr key={s.key}>
                <Td strong>{s.label}</Td>
                <Td>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-[var(--accent)] underline underline-offset-2">
                    {s.url.replace(/^https?:\/\//, "")}
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </section>

      <section className="mt-8">
        <SectionHeading>How often we re-check</SectionHeading>
        <Prose>
          <p className="mt-2">
            State top-ups and tariffs get a full pass every quarter, because state schemes routinely pause when the
            annual budget is exhausted — that is normal, not a scandal, but it does mean a figure verified in January
            can be wrong by June. The central subsidy text on pmsuryaghar.gov.in is checked against our engine
            automatically. Wherever a figure appears on this site, the date we last checked it appears next to it.
          </p>
        </Prose>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
