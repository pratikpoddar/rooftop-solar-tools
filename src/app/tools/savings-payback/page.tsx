import type { Metadata } from "next";
import { Breadcrumbs, Container, Prose } from "@/components/ui";
import { ToolMount } from "@/components/tools/ToolMount";
import { breadcrumbSchema, jsonLd, toolSchema } from "@/lib/schema";

const PATH = "/tools/savings-payback";
const TITLE = "Solar Savings & Payback Calculator — 25-Year Estimate";
const DESCRIPTION =
  "How much rooftop solar saves you in year one, how long it takes to pay for itself, and what 25 years adds up to — with your state's net-metering rule applied.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Solar savings and payback calculator" }];

export default function Page() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Solar savings and payback calculator</h1>
      <Prose>
        <p className="mt-2 max-w-2xl">Two states with identical sunshine can have very different answers, because a unit you export is worth full retail in one and a wholesale rate in the other. This applies your state&rsquo;s actual rule.</p>
      </Prose>
      <div className="mt-8">
        <ToolMount kind="savings" sourcePage={PATH} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(toolSchema({ name: "Solar savings and payback calculator", description: DESCRIPTION, path: PATH }))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
