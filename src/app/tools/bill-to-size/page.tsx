import type { Metadata } from "next";
import { Breadcrumbs, Container, Prose } from "@/components/ui";
import { ToolMount } from "@/components/tools/ToolMount";
import { breadcrumbSchema, jsonLd, toolSchema } from "@/lib/schema";

const PATH = "/tools/bill-to-size";
const TITLE = "What Size Solar System Do I Need? Bill to kW Calculator";
const DESCRIPTION =
  "Enter your monthly electricity bill or units and get the right system size in kW, the shadow-free roof area it needs, and the cost after subsidy.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const TRAIL = [{ label: "Home", href: "/" }, { label: "What size solar system do I need?" }];

export default function Page() {
  return (
    <Container className="py-8">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What size solar system do I need?</h1>
      <Prose>
        <p className="mt-2 max-w-2xl">Buy for your consumption, not for your roof. This sizes a system to offset about 85% of what you actually use, capped at your sanctioned load — the two limits installers tend to skip.</p>
      </Prose>
      <div className="mt-8">
        <ToolMount kind="size" sourcePage={PATH} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(toolSchema({ name: "What size solar system do I need?", description: DESCRIPTION, path: PATH }))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(TRAIL))} />
    </Container>
  );
}
