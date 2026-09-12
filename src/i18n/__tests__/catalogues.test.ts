import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "../locales";
import { getMessages } from "../index";

/**
 * Translation-completeness, which the type system cannot check.
 *
 * `satisfies Messages` proves every key exists. It cannot prove the value is
 * not still English — a stub catalogue full of English text typechecks
 * perfectly. That is the exact failure that would publish duplicate English
 * under an hreflang claiming Tamil, so it is asserted here instead.
 */

function leaves(obj: unknown, path: string[] = []): { path: string; value: string }[] {
  if (typeof obj === "string") return [{ path: path.join("."), value: obj }];
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) => leaves(v, [...path, k]));
  }
  return [];
}

const english = new Map(leaves(getMessages("en")).map((l) => [l.path, l.value]));

describe("message catalogues", () => {
  it("gives every locale the same key set", () => {
    const expected = [...english.keys()].sort();
    for (const l of LOCALES) {
      const got = leaves(getMessages(l.code as Locale))
        .map((x) => x.path)
        .sort();
      expect(got, l.code).toEqual(expected);
    }
  });

  it("preserves every {placeholder} in every translation", () => {
    // A dropped placeholder renders a literal "{amount}" to a user, and an
    // invented one renders "{foo}" forever — both are silent in production.
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");
    for (const l of LOCALES) {
      if (l.code === "en") continue;
      for (const { path, value } of leaves(getMessages(l.code as Locale))) {
        expect(placeholders(value), `${l.code} → ${path}`).toBe(placeholders(english.get(path) ?? ""));
      }
    }
  });

  it("does not ship English text under a launched non-English locale", () => {
    for (const l of LOCALES) {
      if (l.code === "en" || !l.launched) continue;
      const same = leaves(getMessages(l.code as Locale)).filter(
        ({ path, value }) => value === english.get(path),
      );
      // A handful of leaves can legitimately coincide (bare product names), but
      // a stub would light this up at close to 100%.
      const share = same.length / english.size;
      expect(share, `${l.code} has ${same.length}/${english.size} strings identical to English`).toBeLessThan(0.05);
    }
  });

  it("keeps every launched locale non-empty everywhere", () => {
    for (const l of LOCALES) {
      if (!l.launched) continue;
      for (const { path, value } of leaves(getMessages(l.code as Locale))) {
        expect(value.trim().length, `${l.code} → ${path}`).toBeGreaterThan(0);
      }
    }
  });
});
