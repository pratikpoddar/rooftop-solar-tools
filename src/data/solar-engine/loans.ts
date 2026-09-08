import type { Bank, LoanSchedule } from "./types";

const V = "2026-09-08";

/**
 * PM Surya Ghar collateral-free rooftop loans (spec §2.6). SBI, Canara and
 * Union rates come from the spec; BoB and Indian Bank appear in the spec's
 * comparison list without a rate, so theirs are marked approximate.
 */
export const BANKS: Bank[] = [
  {
    id: "sbi",
    name: "State Bank of India",
    ratePct: 7.15,
    maxCollateralFreeRs: 200000,
    minTenureYears: 3,
    maxTenureYears: 10,
    url: "https://sbi.bank.in/web/sbi-green/green-loans/personal/pm-surya-ghar-loan-for-solar-roof-top",
    lastVerified: V,
    confidence: "verified",
    source: "sbi-pm-surya-ghar",
  },
  {
    id: "canara",
    name: "Canara Bank",
    ratePct: 7.3,
    maxCollateralFreeRs: 200000,
    minTenureYears: 3,
    maxTenureYears: 10,
    url: "https://canarabank.com",
    lastVerified: V,
    confidence: "verified",
    source: "pm-surya-ghar-bank-list",
  },
  {
    id: "union",
    name: "Union Bank of India",
    ratePct: 7.35,
    maxCollateralFreeRs: 200000,
    minTenureYears: 3,
    maxTenureYears: 10,
    url: "https://www.unionbankofindia.co.in",
    lastVerified: V,
    confidence: "verified",
    source: "pm-surya-ghar-bank-list",
  },
  {
    id: "bob",
    name: "Bank of Baroda",
    ratePct: 7.4,
    maxCollateralFreeRs: 200000,
    minTenureYears: 3,
    maxTenureYears: 10,
    url: "https://www.bankofbaroda.in",
    lastVerified: V,
    confidence: "approximate",
    source: "pm-surya-ghar-bank-list",
  },
  {
    id: "indian-bank",
    name: "Indian Bank",
    ratePct: 7.4,
    maxCollateralFreeRs: 200000,
    minTenureYears: 3,
    maxTenureYears: 10,
    url: "https://www.indianbank.in",
    lastVerified: V,
    confidence: "approximate",
    source: "pm-surya-ghar-bank-list",
  },
];

/** Collateral-free ceiling under the scheme. */
export const COLLATERAL_FREE_CAP = 200000;

export function getBank(id: string): Bank | undefined {
  return BANKS.find((b) => b.id === id);
}

export function cheapestBank(): Bank {
  return [...BANKS].sort((a, b) => a.ratePct - b.ratePct)[0];
}

/** EMI = P·r·(1+r)^n / ((1+r)^n − 1), with r monthly and n in months (spec §2.6). */
export function emi(principal: number, annualRatePct: number, tenureYears: number): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = Math.round(tenureYears * 12);
  if (r === 0) return Math.round(principal / n);
  const growth = Math.pow(1 + r, n);
  return Math.round((principal * r * growth) / (growth - 1));
}

export function loanSchedule(principal: number, annualRatePct: number, tenureYears: number): LoanSchedule {
  const monthly = emi(principal, annualRatePct, tenureYears);
  const n = Math.round(tenureYears * 12);
  const totalPayable = monthly * n;
  return {
    principal,
    ratePct: annualRatePct,
    tenureYears,
    emi: monthly,
    totalInterest: Math.max(0, totalPayable - principal),
    totalPayable,
  };
}

/** Default loan amount: the whole net cost, capped at the collateral-free ceiling. */
export function defaultLoanAmount(netCost: number): number {
  return Math.min(Math.max(0, Math.round(netCost)), COLLATERAL_FREE_CAP);
}

/** The month at which cumulative bill savings overtake cumulative EMI outgo. */
export function breakEvenMonth(monthlyEmi: number, monthlySaving: number, tenureYears: number): number | null {
  if (monthlySaving >= monthlyEmi) return 1;
  const n = Math.round(tenureYears * 12);
  return monthlySaving > 0 ? n + 1 : null;
}
