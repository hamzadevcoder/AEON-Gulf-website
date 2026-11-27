import { cache } from 'react';
import { isLocale, type Locale } from './config';

/** The language of the current request, set by each page/layout under app/[lang]. */
const store = cache(() => ({ locale: 'en' as Locale }));
export const setLocale = (l: string) => {
  store().locale = isLocale(l) ? l : 'en';
};
export const getLocale = (): Locale => store().locale;
