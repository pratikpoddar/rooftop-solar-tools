/** Data sources (spec §10). Every `source` key in the engine resolves here. */
export interface Source {
  key: string;
  label: string;
  url: string;
}

export const SOURCES: Record<string, Source> = {
  "pm-surya-ghar": {
    key: "pm-surya-ghar",
    label: "PM Surya Ghar national portal",
    url: "https://pmsuryaghar.gov.in",
  },
  "cfa-structure": {
    key: "cfa-structure",
    label: "MNRE CFA structure (PDF)",
    url: "https://pmsg-production-public.s3.ap-south-1.amazonaws.com/CFA_structure20240307.pdf",
  },
  "scheme-guidelines": {
    key: "scheme-guidelines",
    label: "PM Surya Ghar scheme guidelines, MNRE (PDF)",
    url: "https://cdnbbsr.s3waas.gov.in/s3716e1b8c6cd17b771da77391355749f3/uploads/2025/07/202507081690964295.pdf",
  },
  "state-top-up-map": {
    key: "state-top-up-map",
    label: "State top-up subsidy map",
    url: "https://quickestimate.co/blog/state-top-up-subsidies-pm-surya-ghar",
  },
  "geda-surya-gujarat": {
    key: "geda-surya-gujarat",
    label: "Surya Gujarat (GEDA / GUVNL)",
    url: "https://suryagujarat.guvnl.in",
  },
  upneda: { key: "upneda", label: "UPNEDA", url: "https://upneda.org.in" },
  rrecl: { key: "rrecl", label: "RRECL, Government of Rajasthan", url: "https://energy.rajasthan.gov.in/rrecl" },
  hareda: { key: "hareda", label: "HAREDA", url: "https://hareda.gov.in" },
  "delhi-solar": { key: "delhi-solar", label: "Delhi Solar Portal", url: "https://solar.delhi.gov.in" },
  mpuvn: { key: "mpuvn", label: "MPUVN", url: "https://mpuvn.mp.gov.in" },
  "cost-benchmarks": {
    key: "cost-benchmarks",
    label: "Solar panel cost in India 2025",
    url: "https://gosolarindex.in/blog/solar-panel-cost-india-2025",
  },
  "generation-by-state": {
    key: "generation-by-state",
    label: "Solar generation by state (traces to MNRE Solar Atlas / NREL India)",
    url: "https://www.heavengreenenergy.com/blog/solar-generation-by-state",
  },
  "net-metering-state-rules": {
    key: "net-metering-state-rules",
    label: "Net-metering rules, state-wise",
    url: "https://de.energy/net-metering-state-wise-rules/",
  },
  "serc-tariff-orders": {
    key: "serc-tariff-orders",
    label: "State electricity regulatory commission tariff orders",
    url: "https://pmsuryaghar.gov.in",
  },
  "state-average-effective-rate": {
    key: "state-average-effective-rate",
    label: "State average effective domestic tariff (pending slab pass)",
    url: "https://pmsuryaghar.gov.in",
  },
  "sbi-pm-surya-ghar": {
    key: "sbi-pm-surya-ghar",
    label: "SBI PM Surya Ghar rooftop loan",
    url: "https://sbi.bank.in/web/sbi-green/green-loans/personal/pm-surya-ghar-loan-for-solar-roof-top",
  },
  "pm-surya-ghar-bank-list": {
    key: "pm-surya-ghar-bank-list",
    label: "PM Surya Ghar bank loan list",
    url: "https://myrsolar.com/pm-surya-ghar-bank-loan-list",
  },
};

export function getSource(key: string): Source | undefined {
  return SOURCES[key];
}
