import type { ReactNode } from "react";
import type { SavingsYear } from "@/data/solar-engine";
import { MONTH_LABELS, formatIndianNumber, rupeesShort } from "@/data/solar-engine";
import { Details } from "./controls";
import { TableWrap, Td, Th } from "./ui";

/*
 * Charts are plain inline SVG — no chart library, no client JS. This niche is
 * mobile-first on cheap bandwidth and the LCP budget is 1.5s on 4G (spec §5).
 *
 * Because an SVG with a fixed viewBox scales its text along with everything
 * else, one geometry cannot serve both a ~290px phone column and a ~660px
 * desktop one: labels sized for the desktop render at about 5px on a phone.
 * So each chart ships two geometries — `compact` and `wide` — swapped by a
 * media query, with the caption and table view rendered once outside them.
 *
 * The interaction layer is native rather than scripted: <title> elements give
 * per-mark tooltips, and every chart has an adjacent table view, so the data is
 * reachable without hover or colour.
 */

type Size = "compact" | "wide";

const CHART_STYLE = `
.viz-axis { fill: var(--fg-subtle); font-variant-numeric: tabular-nums; }
.viz-label { font-weight: 600; fill: var(--fg); font-variant-numeric: tabular-nums; }
.viz-grid { stroke: var(--line); stroke-width: 1; }
.viz-rule { stroke: var(--line-strong); stroke-width: 1.5; stroke-dasharray: 4 3; }
.viz-fill-1 { fill: #d97706; }
/* Stroke-only: a CSS \`fill\` rule would override a fill="none" attribute. */
.viz-stroke-1 { stroke: #d97706; fill: none; }
.viz-series-cost { fill: #2a78d6; }
.viz-series-save { fill: #1baf7a; }
.viz-compact { display: block; }
.viz-wide { display: none; }
@media (min-width: 640px) {
  .viz-compact { display: none; }
  .viz-wide { display: block; }
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .viz-fill-1 { fill: #fbbf24; }
  :root:not([data-theme="light"]) .viz-stroke-1 { stroke: #fbbf24; }
  :root:not([data-theme="light"]) .viz-series-cost { fill: #3987e5; }
  :root:not([data-theme="light"]) .viz-series-save { fill: #199e70; }
}
`;

function ChartStyle() {
  return <style dangerouslySetInnerHTML={{ __html: CHART_STYLE }} />;
}

/** Renders the compact geometry on phones and the wide one from the sm breakpoint up. */
function Responsive({ render }: { render: (size: Size) => ReactNode }) {
  return (
    <>
      <ChartStyle />
      <div className="viz-compact">{render("compact")}</div>
      <div className="viz-wide">{render("wide")}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 25-year cumulative savings — change over time, one series
// ---------------------------------------------------------------------------

const CUMULATIVE_GEOMETRY: Record<Size, {
  w: number;
  h: number;
  pad: { top: number; right: number; bottom: number; left: number };
  axisFont: number;
  labelFont: number;
  gridSteps: number[];
  xTicks: number[];
}> = {
  compact: {
    w: 360,
    h: 250,
    pad: { top: 20, right: 10, bottom: 30, left: 46 },
    axisFont: 13,
    labelFont: 13,
    gridSteps: [0, 0.5, 1],
    xTicks: [1, 10, 20, 25],
  },
  wide: {
    w: 640,
    h: 240,
    pad: { top: 18, right: 14, bottom: 30, left: 56 },
    axisFont: 11,
    labelFont: 11,
    gridSteps: [0, 0.25, 0.5, 0.75, 1],
    xTicks: [1, 5, 10, 15, 20, 25],
  },
};

export function CumulativeSavingsChart({
  years,
  netCost,
  paybackYears,
}: {
  years: SavingsYear[];
  netCost: number;
  paybackYears: number;
}) {
  const last = years[years.length - 1];
  const description = `Cumulative savings reach ${rupeesShort(last.cumulative)} by year ${years.length}. The system cost of ${rupeesShort(netCost)} is recovered in about ${paybackYears} years.`;

  return (
    <figure className="m-0">
      <Responsive
        render={(size) => <CumulativeSvg size={size} years={years} netCost={netCost} paybackYears={paybackYears} label={description} />}
      />
      <figcaption className="mt-2">
        <Details summary="See the year-by-year table">
          <TableWrap>
            <thead>
              <tr>
                <Th>Year</Th>
                <Th align="right">Units</Th>
                <Th align="right">Bill saving</Th>
                <Th align="right">Surplus sold</Th>
                <Th align="right">Costs</Th>
                <Th align="right">Cumulative</Th>
              </tr>
            </thead>
            <tbody>
              {years.map((d) => (
                <tr key={d.year}>
                  <Td strong nowrap>
                    {d.year}
                  </Td>
                  <Td align="right">{formatIndianNumber(d.generationKwh)}</Td>
                  <Td align="right">{formatIndianNumber(d.selfConsumptionSaving)}</Td>
                  <Td align="right">{d.exportCredit ? formatIndianNumber(d.exportCredit) : "—"}</Td>
                  <Td align="right">{formatIndianNumber(d.omCost + d.inverterCost)}</Td>
                  <Td align="right">{formatIndianNumber(d.cumulative)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Details>
      </figcaption>
    </figure>
  );
}

function CumulativeSvg({
  size,
  years,
  netCost,
  paybackYears,
  label,
}: {
  size: Size;
  years: SavingsYear[];
  netCost: number;
  paybackYears: number;
  label: string;
}) {
  const g = CUMULATIVE_GEOMETRY[size];
  const plotW = g.w - g.pad.left - g.pad.right;
  const plotH = g.h - g.pad.top - g.pad.bottom;

  const maxY = Math.max(...years.map((y) => y.cumulative), netCost) * 1.06;
  const x = (year: number) => g.pad.left + ((year - 1) / (years.length - 1)) * plotW;
  const y = (value: number) => g.pad.top + plotH - (value / maxY) * plotH;

  const line = years.map((d) => `${x(d.year).toFixed(1)},${y(d.cumulative).toFixed(1)}`).join(" ");
  const area = `${g.pad.left},${g.pad.top + plotH} ${line} ${g.pad.left + plotW},${g.pad.top + plotH}`;
  const showPayback = Number.isFinite(paybackYears) && paybackYears >= 1 && paybackYears <= years.length;

  /*
   * The y axis carries bare numbers with the unit named once at the top left.
   * Spelling "19.48 lakh" out on every gridline needs about 60px of gutter,
   * which the compact geometry does not have — the labels get clipped by the
   * SVG viewport rather than overflowing visibly.
   */
  const crore = maxY >= 10000000;
  const divisor = crore ? 10000000 : 100000;
  const unit = crore ? "Rs crore" : "Rs lakh";

  // Keep the payback label inside the plot: flip it left when the crossing is
  // far right, and above the rule when a cheap system puts the rule near the
  // x axis, where the label would otherwise sit on top of the year ticks.
  const paybackX = showPayback ? x(paybackYears) : 0;
  const paybackAnchorEnd = paybackX > g.pad.left + plotW * 0.55;
  const ruleY = y(netCost);
  const labelBelowFits = ruleY + g.labelFont + 10 < g.pad.top + plotH;
  const paybackLabelY = labelBelowFits ? ruleY + g.labelFont + 6 : ruleY - 10;

  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} width="100%" role="img" aria-label={label} className="block h-auto w-full">
      {g.gridSteps.map((f) => {
        const v = f * maxY;
        return (
          <g key={f}>
            <line className="viz-grid" x1={g.pad.left} x2={g.w - g.pad.right} y1={y(v)} y2={y(v)} />
            <text className="viz-axis" fontSize={g.axisFont} x={g.pad.left - 8} y={y(v) + g.axisFont / 3} textAnchor="end">
              {v === 0 ? "0" : (v / divisor).toFixed(1)}
            </text>
          </g>
        );
      })}

      <text className="viz-axis" fontSize={g.axisFont} x={0} y={g.axisFont}>
        {unit}
      </text>

      <polygon points={area} className="viz-fill-1" fillOpacity={0.16} stroke="none" />
      <polyline points={line} className="viz-stroke-1" strokeWidth={2} strokeLinejoin="round" />

      {/* What you paid — the line the area has to cross for payback. */}
      <line className="viz-rule" x1={g.pad.left} x2={g.w - g.pad.right} y1={ruleY} y2={ruleY} />
      <text
        className="viz-axis"
        fontSize={g.axisFont}
        x={g.w - g.pad.right}
        y={labelBelowFits ? ruleY - 6 : ruleY - g.labelFont - 12}
        textAnchor="end"
      >
        you paid {rupeesShort(netCost)}
      </text>


      {showPayback ? (
        <g>
          <line className="viz-rule" x1={paybackX} x2={paybackX} y1={ruleY} y2={g.pad.top + plotH} />
          <circle cx={paybackX} cy={ruleY} r={4.5} className="viz-fill-1" stroke="var(--bg)" strokeWidth={2} />
          <text
            className="viz-label"
            fontSize={g.labelFont}
            x={paybackAnchorEnd ? paybackX - 8 : paybackX + 8}
            y={paybackLabelY}
            textAnchor={paybackAnchorEnd ? "end" : "start"}
          >
            paid back in {paybackYears}y
          </text>
        </g>
      ) : null}

      {years.map((d) => (
        <circle key={d.year} cx={x(d.year)} cy={y(d.cumulative)} r={9} fill="transparent">
          <title>{`Year ${d.year}: ${rupeesShort(d.cumulative)} saved so far`}</title>
        </circle>
      ))}

      {g.xTicks
        .filter((t) => t <= years.length)
        .map((tick) => (
          <text key={tick} className="viz-axis" fontSize={g.axisFont} x={x(tick)} y={g.h - 10} textAnchor="middle">
            {tick === 1 ? "Yr 1" : tick}
          </text>
        ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Monthly generation — magnitude across 12 categories, one series
// ---------------------------------------------------------------------------

export function MonthlyGenerationChart({ monthlyKwh, caption = true }: { monthlyKwh: number[]; caption?: boolean }) {
  const max = Math.max(...monthlyKwh);
  const peak = monthlyKwh.indexOf(max);
  const trough = monthlyKwh.indexOf(Math.min(...monthlyKwh));
  const label = `Monthly generation peaks at ${formatIndianNumber(max)} units in ${MONTH_LABELS[peak]} and bottoms out at ${formatIndianNumber(monthlyKwh[trough])} units in ${MONTH_LABELS[trough]}.`;

  return (
    <figure className="m-0">
      <Responsive render={(size) => <MonthlyBarsSvg size={size} monthlyKwh={monthlyKwh} label={label} />} />
      {caption ? (
        <figcaption className="mt-1.5 text-xs text-[var(--fg-subtle)]">
          Units generated per month. {MONTH_LABELS[trough]} is your worst month at{" "}
          {Math.round((monthlyKwh[trough] / max) * 100)}% of {MONTH_LABELS[peak]} — the seasonal dip is normal, not a
          fault.
        </figcaption>
      ) : null}
    </figure>
  );
}

/** A vertical bar with a 4px rounded top and a square base on the axis. */
function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

function MonthlyBarsSvg({ size, monthlyKwh, label }: { size: Size; monthlyKwh: number[]; label: string }) {
  const g =
    size === "compact"
      ? { w: 360, h: 190, pad: { top: 22, right: 4, bottom: 26, left: 4 }, axisFont: 12, labelFont: 12, gap: 4 }
      : { w: 640, h: 200, pad: { top: 22, right: 8, bottom: 26, left: 8 }, axisFont: 11, labelFont: 11, gap: 8 };

  const plotW = g.w - g.pad.left - g.pad.right;
  const plotH = g.h - g.pad.top - g.pad.bottom;
  const max = Math.max(...monthlyKwh);
  const slot = plotW / 12;
  const barW = slot - g.gap;
  const peak = monthlyKwh.indexOf(max);
  const trough = monthlyKwh.indexOf(Math.min(...monthlyKwh));

  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} width="100%" role="img" aria-label={label} className="block h-auto w-full">
      <line className="viz-grid" x1={g.pad.left} x2={g.w - g.pad.right} y1={g.pad.top + plotH} y2={g.pad.top + plotH} />
      {monthlyKwh.map((v, i) => {
        const h = Math.max(2, (v / max) * plotH);
        const bx = g.pad.left + i * slot + g.gap / 2;
        const by = g.pad.top + plotH - h;
        const labelled = i === peak || i === trough;
        return (
          <g key={i}>
            <path d={barPath(bx, by, barW, h)} className="viz-fill-1" fillOpacity={labelled ? 1 : 0.55}>
              <title>{`${MONTH_LABELS[i]}: ${formatIndianNumber(v)} units`}</title>
            </path>
            {labelled ? (
              <text className="viz-label" fontSize={g.labelFont} x={bx + barW / 2} y={by - 6} textAnchor="middle">
                {formatIndianNumber(v)}
              </text>
            ) : null}
            <text className="viz-axis" fontSize={g.axisFont} x={bx + barW / 2} y={g.h - 9} textAnchor="middle">
              {MONTH_LABELS[i].slice(0, 1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// EMI vs bill saving — two directly-labelled bars
// ---------------------------------------------------------------------------

export function EmiVsSavingChart({ emi, saving }: { emi: number; saving: number }) {
  const label = `A monthly EMI of ${rupeesShort(emi)} against a monthly bill saving of ${rupeesShort(saving)}.`;

  return (
    <figure className="m-0">
      <Responsive render={(size) => <EmiBarsSvg size={size} emi={emi} saving={saving} label={label} />} />
      <figcaption className="mt-1.5 text-xs text-[var(--fg-subtle)]">
        {saving >= emi
          ? `Your bill saving covers the EMI with ${rupeesShort(saving - emi)} a month left over — the system pays for itself from month one.`
          : `The EMI runs ${rupeesShort(emi - saving)} a month ahead of the saving. A longer tenure or a smaller system closes the gap.`}
      </figcaption>
    </figure>
  );
}

/** A horizontal bar with a 4px rounded value end and a square base. */
function hBarPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.min(r, w, h / 2);
  return `M${x},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h - radius} Q${x + w},${y + h} ${x + w - radius},${y + h} L${x},${y + h} Z`;
}

function EmiBarsSvg({ size, emi, saving, label }: { size: Size; emi: number; saving: number; label: string }) {
  const rows = [
    { name: "Loan EMI", value: emi, cls: "viz-series-cost" },
    { name: "Bill saving", value: saving, cls: "viz-series-save" },
  ];
  const max = Math.max(emi, saving, 1);

  // On a phone the name goes above its bar; there is no room for a label gutter.
  if (size === "compact") {
    const w = 360;
    const barH = 28;
    const rowH = 66;
    const h = rows.length * rowH;
    const valueGutter = 92;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} className="block h-auto w-full">
        {rows.map((r, i) => {
          const top = i * rowH;
          const barW = Math.max(3, (r.value / max) * (w - valueGutter));
          return (
            <g key={r.name}>
              <text className="viz-axis" fontSize={13} x={0} y={top + 13}>
                {r.name}
              </text>
              <path d={hBarPath(0, top + 22, barW, barH)} className={r.cls}>
                <title>{`${r.name}: ${rupeesShort(r.value)} per month`}</title>
              </path>
              <text className="viz-label" fontSize={14} x={barW + 10} y={top + 22 + barH / 2 + 5}>
                {rupeesShort(r.value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const w = 640;
  const h = 118;
  const labelGutter = 120;
  const valueGutter = 96;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} className="block h-auto w-full">
      {rows.map((r, i) => {
        const barH = 34;
        const top = 8 + i * (barH + 18);
        const barW = Math.max(3, (r.value / max) * (w - labelGutter - valueGutter));
        return (
          <g key={r.name}>
            <text className="viz-label" fontSize={11} x={labelGutter - 12} y={top + barH / 2 + 4} textAnchor="end">
              {r.name}
            </text>
            <path d={hBarPath(labelGutter, top, barW, barH)} className={r.cls}>
              <title>{`${r.name}: ${rupeesShort(r.value)} per month`}</title>
            </path>
            <text className="viz-label" fontSize={11} x={labelGutter + barW + 10} y={top + barH / 2 + 4}>
              {rupeesShort(r.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
