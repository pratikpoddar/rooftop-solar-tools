import type { Metadata } from "next";
import { Breadcrumbs, Container, Prose } from "@/components/ui";
import { ToolMount } from "@/components/tools/ToolMount";
import { breadcrumbSchema, jsonLd, toolSchema } from "@/lib/schema";

const PATH = "/tools/loan-emi";
const TITLE = "Solar Loan EMI Calculator — PM Surya Ghar Rooftop Loans";
const DESCRIPTION =
  "Compare collateral-free PM Surya Ghar rooftop solar loans across five banks, and see the EMI next to the electricity bill it replaces.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "Solar loan EMI calculator" }];

export default function Page() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Solar loan EMI calculator</h1>
      <Prose>
        <p className="mt-2 max-w-2xl">Rooftop loans are collateral-free up to Rs 2 lakh at around 7%. The number that matters is not the EMI on its own — it is the EMI next to the bill it replaces.</p>
      </Prose>
      <div className="mt-8">
        <ToolMount kind="emi" sourcePage={PATH} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(toolSchema({ name: "Solar loan EMI calculator", description: DESCRIPTION, path: PATH }))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
