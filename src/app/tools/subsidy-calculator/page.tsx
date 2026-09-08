import type { Metadata } from "next";
import { Breadcrumbs, Container, Prose } from "@/components/ui";
import { ToolMount } from "@/components/tools/ToolMount";
import { breadcrumbSchema, jsonLd, toolSchema } from "@/lib/schema";

const PATH = "/tools/subsidy-calculator";
const TITLE = "PM Surya Ghar Subsidy Calculator 2026 — Central + State Top-Up";
const DESCRIPTION =
  "Work out your exact PM Surya Ghar subsidy: the central CFA plus your state top-up, the system cost, and what you actually pay after subsidy.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "PM Surya Ghar subsidy calculator" }];

export default function Page() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">PM Surya Ghar subsidy calculator</h1>
      <Prose>
        <p className="mt-2 max-w-2xl">The central subsidy is the same across India. The state top-up is not, and it is where most of the confusion lives. Pick your state and size to see both, plus what is left for you to pay.</p>
      </Prose>
      <div className="mt-8">
        <ToolMount kind="subsidy" sourcePage={PATH} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(toolSchema({ name: "PM Surya Ghar subsidy calculator", description: DESCRIPTION, path: PATH }))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
