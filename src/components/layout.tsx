import Link from "next/link";
import { SITE } from "@/lib/site";
import { ENGINE_VERSION } from "@/data/solar-engine";
import { Container } from "./ui";

const TOOLS = [
  { href: "/tools/subsidy-calculator", label: "Subsidy" },
  { href: "/tools/bill-to-size", label: "What size" },
  { href: "/tools/savings-payback", label: "Savings" },
  { href: "/tools/loan-emi", label: "Loan EMI" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="size-5 rounded-full bg-[var(--color-sun-400)]" />
          {SITE.name}
        </Link>
        <nav aria-label="Tools" className="-mr-2 overflow-x-auto">
          <ul className="flex items-center gap-1 text-sm">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="block whitespace-nowrap rounded-md px-2 py-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--fg)]"
                >
                  {tool.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--bg-soft)] py-8">
      <Container className="space-y-4 text-sm text-[var(--fg-muted)]">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-[var(--fg)]">Tools</p>
            <ul className="mt-2 space-y-1.5">
              {TOOLS.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="hover:text-[var(--accent)] hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">By state &amp; city</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="/solar-subsidy" className="hover:text-[var(--accent)] hover:underline">
                  Solar subsidy by state
                </Link>
              </li>
              <li>
                <Link href="/solar-panel-price" className="hover:text-[var(--accent)] hover:underline">
                  Solar price by city
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">Official sources</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] hover:underline">
                  PM Surya Ghar portal
                </a>
              </li>
              <li>
                <Link href="/sources" className="hover:text-[var(--accent)] hover:underline">
                  Where our numbers come from
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--fg-subtle)]">
          We are not an installer and we do not sell hardware. Estimates are based on published central and state rates,
          SERC tariff orders and MNRE generation data; your installer quote and DISCOM approval are final. We never sell
          your personal data — the only thing that happens with your details is an introduction you explicitly asked
          for. Numbers engine v{ENGINE_VERSION}.
        </p>
      </Container>
    </footer>
  );
}
