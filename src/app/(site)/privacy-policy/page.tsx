import type { Metadata } from 'next';
import { LegalPage } from '@/components/sections/legal/LegalPage';
import { getPolicies } from '@/server/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Privacy Policy', description: 'How AEON Gulf collects, uses and protects your personal information when you use our website or send an enquiry.', path: '/privacy-policy' });

export default async function Page() {
  return <LegalPage policy={(await getPolicies())['privacy-policy']} />;
}
