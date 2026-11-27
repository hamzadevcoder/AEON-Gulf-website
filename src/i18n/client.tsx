'use client';

import { createContext, useCallback, useContext } from 'react';
import { defaultMessages, translate, type Messages, type T } from './dict';
import { localizeHref, type Locale } from './config';

const Ctx = createContext<{ locale: Locale; messages: Messages }>({ locale: 'en', messages: defaultMessages.en });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx).locale;

export function useT(): T {
  const { messages } = useContext(Ctx);
  return useCallback((key, vars) => translate(messages, key, vars), [messages]);
}

/** href → the same href on the current language's site. */
export function useHref() {
  const locale = useLocale();
  return useCallback((href: string) => localizeHref(href, locale), [locale]);
}
