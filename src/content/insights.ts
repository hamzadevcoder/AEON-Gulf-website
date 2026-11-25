import type { ImageKey } from './images';

/**
 * Built-in guides (used to seed the database and as a fallback). Each one is built from a service's approved content (its FAQs, steps and "why us" copy
 * from the client spreadsheet), with a short introduction written for the guide.
 */
export type GuideSource = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  country: 'kuwait' | 'qatar' | 'saudi-arabia';
  countryName: string;
  category: string;
  image: ImageKey | string; // image slot key or a full URL
  service: string; // slug of the related service in that country
  intro: string[];
};

export const guideSources: GuideSource[] = [
  {
    slug: 'branch-or-subsidiary-kuwait',
    title: 'Branch or subsidiary? Choosing a structure in Kuwait',
    excerpt: 'How liability, capital and governance differ between a branch office and a local company.',
    metaTitle: 'Branch or Subsidiary in Kuwait? How to Choose',
    metaDescription: 'Branch office or local company in Kuwait? Compare liability, capital and governance, with answers to the questions foreign investors ask most.',
    country: 'kuwait',
    countryName: 'Kuwait',
    category: 'Guide',
    image: 'corporate',
    service: 'branch-formation',
    intro: [
      'Foreign companies entering Kuwait usually choose between registering a branch of the parent company and setting up a separate local company. The choice affects who carries liability, how much capital is needed, and what has to be maintained once the entity is trading.',
      'This guide answers the questions our clients ask most often when weighing up a branch in Kuwait.',
    ],
  },
  {
    slug: 'annual-compliance-calendar-qatar',
    title: 'Building your annual compliance calendar in Qatar',
    excerpt: 'Which filings and renewals fall due each year, and how early to start preparing them.',
    metaTitle: 'Annual Compliance Calendar for Qatar Companies',
    metaDescription: 'Which filings and renewals fall due each year in Qatar, how early to start preparing them, and what happens if a deadline is missed.',
    country: 'qatar',
    countryName: 'Qatar',
    category: 'Guide',
    image: 'documents',
    service: 'annual-compliance',
    intro: [
      'Every company in Qatar has a set of filings and renewals that come round each year. Keeping track of them is what keeps licences valid and labour files open.',
      'This guide covers what falls due, when to start preparing, and what happens if a deadline is missed.',
    ],
  },
  {
    slug: 'corporate-bank-account-saudi-arabia',
    title: 'Opening a corporate bank account in Saudi Arabia',
    excerpt: 'The documents banks ask for and how to avoid the most common delays.',
    metaTitle: 'Corporate Bank Account in Saudi Arabia: Guide',
    metaDescription: 'The account types, documents and timelines for opening a corporate bank account in Saudi Arabia, and how to avoid the most common delays.',
    country: 'saudi-arabia',
    countryName: 'Saudi Arabia',
    category: 'Guide',
    image: 'accounting',
    service: 'bank-account-opening-assistance',
    intro: [
      'A corporate bank account is one of the first things a new company in Saudi Arabia needs, and one of the steps most likely to cause delays.',
      'This guide sets out the account types available, the documents banks ask for, and how long the process usually takes.',
    ],
  },
];

export const guidePath = (g: { slug: string }) => `/insights/${g.slug}`;
