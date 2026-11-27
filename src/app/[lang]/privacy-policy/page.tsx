import type { Metadata } from 'next';
import { LegalPage } from '@/components/sections/legal/LegalPage';
import { getPolicies } from '@/server/content';
import { pageMetadata } from '@/lib/seo';
import { setLocale, getT } from '@/i18n/server';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  setLocale((await params).lang);
  const t = await getT();
  return pageMetadata({ title: t('legal.privacy'), description: t('meta.privacy.desc'), path: '/privacy-policy' });
}

export default async function Page({ params }: P) {
  setLocale((await params).lang);
  return <LegalPage policy={(await getPolicies())['privacy-policy']} />;
}
