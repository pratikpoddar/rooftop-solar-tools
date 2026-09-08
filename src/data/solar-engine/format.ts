/**
 * Indic number formatting (spec §7: lakh/crore, never 100k). Used by every
 * surface including the share cards, so a number reads the same everywhere.
 */

export function formatIndianNumber(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

export function rupees(value: number): string {
  return `Rs ${formatIndianNumber(value)}`;
}

/** "Rs 2.18 lakh" / "Rs 41.2 lakh" / "Rs 1.4 crore" — for headlines and cards. */
export function rupeesShort(value: number): string {
  const v = Math.round(value);
  if (Math.abs(v) >= 10000000) return `Rs ${trim(v / 10000000)} crore`;
  if (Math.abs(v) >= 100000) return `Rs ${trim(v / 100000)} lakh`;
  return `Rs ${formatIndianNumber(v)}`;
}

function trim(n: number): string {
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, "");
}

export function kwLabel(kw: number): string {
  return `${Number.isInteger(kw) ? kw : kw.toFixed(1)} kW`;
}

export function units(value: number): string {
  return `${formatIndianNumber(value)} units`;
}

export function years(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} years`;
}

/** "8 September 2026" — rendered next to every subsidy and tariff figure. */
export function verifiedDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
