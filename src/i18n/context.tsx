"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getMessages, type Messages } from "./index";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * Locale for the interactive tree.
 *
 * The calculators are several components deep and every one of them needs
 * strings, so threading `lang` as a prop through each would be a lot of churn
 * for no added safety. Context carries it instead; the provider is mounted once
 * per tool, at ToolMount.
 *
 * Defaulting to English rather than throwing is deliberate: a calculator that
 * renders in the wrong language is a bug worth fixing, but one that throws
 * takes the whole page down. The `launched` gate and the catalogue tests are
 * where wrong-language output is actually prevented.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useMessages(): Messages {
  return getMessages(useContext(LocaleContext));
}
