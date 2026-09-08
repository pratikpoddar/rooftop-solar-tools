"use client";

import type { ReactNode } from "react";
import { useId } from "react";

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--fg-subtle)]">{hint}</p> : null}
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25";

export function Select<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className={inputClasses} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function NumberInput({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className={`${inputClasses} nums ${prefix ? "pl-9" : ""} ${suffix ? "pr-14" : ""}`}
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? "" : Number(raw));
          }}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

/**
 * Size slider snapped to the sizes vendors actually quote, so the cost curve is
 * never asked to interpolate somewhere it has no anchor.
 */
export function SizeSlider({
  label,
  value,
  onChange,
  sizes,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  sizes: number[];
}) {
  const id = useId();
  const index = Math.max(0, sizes.indexOf(value));
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="range"
        min={0}
        max={sizes.length - 1}
        step={1}
        value={index}
        aria-valuetext={`${value} kW`}
        onChange={(e) => onChange(sizes[Number(e.target.value)])}
      />
      <div className="nums flex justify-between px-0.5 text-xs text-[var(--fg-subtle)]">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`rounded px-1 py-0.5 tabular-nums transition-colors ${
              s === value ? "font-bold text-[var(--accent)]" : "hover:text-[var(--fg)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function PercentSlider({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = useId();
  return (
    <Field label={`${label}: ${value}%`} hint={hint} htmlFor={id}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-[var(--line-strong)] accent-[var(--color-sun-500)]"
        />
        <span className="text-sm">{label}</span>
      </label>
      {hint ? <p className="ml-7 mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg-inset)] p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              o.value === value
                ? "bg-[var(--bg)] text-[var(--fg)] shadow-sm"
                : "text-[var(--fg-subtle)] hover:text-[var(--fg)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--line)] bg-[var(--bg-soft)]">
      <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-medium marker:content-none">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="text-[var(--fg-subtle)] transition-transform group-open:rotate-90">
            &rsaquo;
          </span>
          {summary}
        </span>
      </summary>
      <div className="border-t border-[var(--line)] px-3.5 py-3">{children}</div>
    </details>
  );
}
