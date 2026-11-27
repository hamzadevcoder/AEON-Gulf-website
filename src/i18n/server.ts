import 'server-only';
import { translate, type T } from './dict';
import type { Locale } from './config';
import { getLocale } from './request';
import { getMessages } from '@/server/content';

export { setLocale, getLocale } from './request';
export { getMessages };

export async function getT(locale: Locale = getLocale()): Promise<T> {
  const m = await getMessages(locale);
  return (key, vars) => translate(m, key, vars);
}
