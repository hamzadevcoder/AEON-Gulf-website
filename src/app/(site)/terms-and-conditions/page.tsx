import type { Metadata } from 'next';
import { LegalPage } from '@/components/sections/legal/LegalPage';
import { getPolicies } from '@/server/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Terms and Conditions', description: 'The terms that apply when you use the AEON Gulf website, forms and content.', path: '/terms-and-conditions' });

export default async function Page() {
  return <LegalPage policy={(await getPolicies())['terms-and-conditions']} />;
}
