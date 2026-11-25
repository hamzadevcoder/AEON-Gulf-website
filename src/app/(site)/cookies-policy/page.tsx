import type { Metadata } from 'next';
import { LegalPage } from '@/components/sections/legal/LegalPage';
import { getPolicies } from '@/server/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Cookies Policy', description: 'How the AEON Gulf website uses essential cookies and similar technologies, and how to manage them.', path: '/cookies-policy' });

export default async function Page() {
  return <LegalPage policy={(await getPolicies())['cookies-policy']} />;
}
