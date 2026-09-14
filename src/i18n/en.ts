/**
 * All user-facing strings for the tools and cards (spec §7).
 *
 * Phase 0 ships English only, but every string a translator needs to touch
 * lives here rather than inline in components, so Phase 1 is "add en → hi/mr/
 * gu/ta/te/kn/ml files and wire next-intl routing", not a rewrite. Interpolation
 * uses {name} placeholders, matching ICU's simple-argument syntax.
 */
export const en = {
  common: {
    getQuotes: "Get free quotes from verified installers",
    shareResult: "Share your result",
    shareOnWhatsApp: "Share on WhatsApp",
    copyLink: "Copy link",
    copied: "Copied",
    lastVerified: "Last verified {date}",
    approximate: "Approximate",
    verified: "Verified",
    assumptions: "Assumptions",
    showAssumptions: "Show the assumptions behind this",
    hideAssumptions: "Hide assumptions",
    nextSteps: "Next steps",
    sources: "Sources",
    perMonth: "/month",
    perYear: "/year",
    recalculate: "Recalculate",
    state: "State",
    city: "City",
    discom: "Electricity board (DISCOM)",
    systemSize: "System size",
    monthlyBill: "Monthly electricity bill",
    monthlyUnits: "Monthly units (kWh)",
    sanctionedLoad: "Sanctioned load",
    dontKnow: "I don't know",
  },
  subsidy: {
    title: "PM Surya Ghar subsidy calculator",
    lede: "What the government will actually pay towards your rooftop system, central plus state.",
    consumerType: "Who is installing",
    individual: "My own home",
    society: "Housing society / RWA common area",
    bpl: "BPL household",
    withinIncomeCeiling: "Household income within the state's ceiling",
    centralSubsidy: "Central subsidy (PM Surya Ghar)",
    stateTopUp: "State top-up",
    totalSubsidy: "Total subsidy",
    systemCost: "Estimated system cost",
    netCost: "You pay",
    effectivePerKw: "Effective cost per kW",
    noTopUp: "No state top-up published for this state",
    checkAvailability: "Budget-dependent — confirm it is still open before you count on it",
    generationIncentive: "Generation incentive (paid over {months} months)",
    card: "My solar subsidy: {amount} ({place}).",
  },
  size: {
    title: "What size solar do I need?",
    lede: "Your bill tells you the system size. Enter either your rupee amount or your units.",
    recommended: "Recommended size",
    idealSize: "Ideal size for your usage",
    roofNeeded: "Shadow-free roof needed",
    grossRoof: "Total roof area, allowing for tank and parapet",
    offsetShare: "Offsets about {pct}% of your consumption",
    card: "My roof needs {kw} kW. {place}.",
  },
  savings: {
    title: "Is solar worth it? 25-year savings and payback",
    lede: "What you save in year one, when the system pays for itself, and what 25 years adds up to.",
    year1Monthly: "Year-1 saving",
    payback: "Pays for itself in",
    lifetime: "25-year savings",
    selfConsumption: "Share of generation you use during the day",
    chartTitle: "Cumulative savings over 25 years",
    monthlyTitle: "Units generated per month",
    emiVsSaving: "EMI vs bill saving",
    compareBanks: "Compare banks →",
    card: "My {kw} kW rooftop in {place} pays back in {payback} and saves {monthly} a month after subsidy.",
    cardNoPayback: "My {kw} kW rooftop in {place} saves {monthly} a month on electricity.",
  },
  emi: {
    title: "Solar loan EMI calculator",
    lede: "Collateral-free up to Rs 2 lakh under PM Surya Ghar. Compare the EMI against what you already pay the DISCOM.",
    loanAmount: "Loan amount",
    bank: "Bank",
    tenure: "Tenure",
    emi: "Monthly EMI",
    totalInterest: "Total interest",
    totalPayable: "Total payable",
    breakEven: "EMI is covered by savings from month",
    bankComparison: "Bank comparison",
    card: "Solar EMI {emi} vs my old bill {bill}.",
  },
  society: {
    title: "Live in a society?",
    body: "Send this to your RWA group. 100 flats is 100 roofs, and a group order usually lands a 5-10% better price than going alone — plus the society's common load (lifts, pumps, corridor lights) gets its own subsidy at {rate} per kW, up to 500 kW.",
    cta: "Share with my society group",
    shareText: "Our society should look at this. A {kw} kW rooftop in {place} saves about {monthly} a month per flat. 100 flats = 100 roofs, and a group order gets a better price.",
  },

  urgency: {
    title: "{amount} is available today",
    body: "PM Surya Ghar is a fixed-outlay scheme — Rs 75,021 crore across a target of 1 crore households — so the central subsidy is finite rather than permanent.",
    stateBudget: "{agency}'s top-up is budget-dependent on top of that and pauses when the state allocation runs out.",
    honest: "There is no published deadline, and we will not invent one. But the money is allocated, not unlimited.",
  },

  lead: {
    title: "Get 3 free quotes",
    lede: "We introduce you to empanelled installers in your city. No spam, no data sold.",
    name: "Name",
    phone: "Mobile number",
    pin: "PIN code",
    consent:
      "Share my details with up to 3 empanelled installers who will call me about a rooftop solar quote.",
    submit: "Request quotes",
    submitting: "Sending…",
    success: "Done. Up to 3 empanelled installers in your area will call you.",
    error: "Could not send that. Please try again.",
    consentRequired: "We need your consent before introducing you to any installer.",
    phoneInvalid: "Enter a valid 10-digit Indian mobile number.",
  },
} as const;

export type Messages = typeof en;

/** Minimal ICU-style interpolation: t(en.subsidy.card, { amount, place }). */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
