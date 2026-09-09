import { SITE } from "@/lib/site";

/**
 * Renders the grievance contact.
 *
 * The DPDP Act requires a reachable contact for data-principal requests, so
 * this must not silently render an empty sentence on a legal page. When
 * NEXT_PUBLIC_CONTACT_EMAIL is unset it says so plainly rather than pretending
 * there is a channel — a visibly missing address is recoverable, an invisible
 * one is not.
 */
export function ContactLine({ purpose }: { purpose: string }) {
  if (!SITE.contactEmail) {
    return (
      <span className="font-medium text-[var(--warn)]">
        A contact address for {purpose} has not been configured yet — set NEXT_PUBLIC_CONTACT_EMAIL. Until then, please
        reach the site owner through whichever channel you found this site.
      </span>
    );
  }
  return (
    <>
      For {purpose}, email{" "}
      <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-[var(--accent)] underline underline-offset-2">
        {SITE.contactEmail}
      </a>
      . We aim to respond within 30 days, as the Act requires.
    </>
  );
}
