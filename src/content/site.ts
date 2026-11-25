/**
 * Site content. Copy is drawn from the client's "Website Text (Updated)" spreadsheet
 * and the current aeon.qrq8.com site. Anything marked `placeholder: true` (or labelled
 * "placeholder" in the UI) still needs real content from AEON Gulf before launch.
 */

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Our Company', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Insights', href: '/insights' },
  { label: 'Get a quote', href: '/quote' },
  { label: 'Contact', href: '/contact' },
];

export const countrySlugs = ['kuwait', 'qatar', 'saudi-arabia'] as const;

/** The country a path belongs to ("/qatar/services/x" → "qatar"), if any. */
export const countryFromPath = (path: string) => countrySlugs.find((c) => path === `/${c}` || path.startsWith(`/${c}/`));

/**
 * Main menu for a given page. Countries are not in the main menu (they are reached from the
 * header country dropdown and the footer's Markets list); on a country page the quote link
 * pre-selects that country.
 */
export function navFor(path: string) {
  const current = countryFromPath(path);
  return nav.map((n) => (n.href === '/quote' && current ? { ...n, href: `/quote?country=${current}` } : n));
}

/** Put pages created in the dashboard (with "show in menu" on) into the menu, just before "Get a quote". */
export function withExtraNav<T extends { href: string; label: string }>(items: T[], extra: { href: string; label: string }[]) {
  if (!extra.length) return items;
  const i = items.findIndex((n) => n.href.startsWith('/quote'));
  const add = extra as unknown as T[];
  return i < 0 ? [...items, ...add] : [...items.slice(0, i), ...add, ...items.slice(i)];
}

export const legal = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms and Conditions', href: '/terms-and-conditions' },
  { label: 'Cookies Policy', href: '/cookies-policy' },
];

export const contact = {
  email: 'info@aeongulf.com',
  phone: '+965 2220 5891',
  phoneHref: 'tel:+96522205891',
  offices: [
    { country: 'Kuwait', detail: 'Kuwait City', phone: '+965 2220 5891', confirmed: true },
    { country: 'Qatar', detail: 'Doha (details to be confirmed)', phone: null, confirmed: false },
    { country: 'Saudi Arabia', detail: 'Riyadh (details to be confirmed)', phone: null, confirmed: false },
  ],
};

export const serviceGroups = [
  {
    title: 'Corporate Services',
    lead: 'Company and branch formation, commercial agencies, nominee and director services, registered office, signatories, escrow and powers of attorney.',
    body: 'We structure your entity for the activity you plan to run, secure the registrations and approvals, and keep its governance in order once it is trading.',
  },
  {
    title: 'PRO and GRO Services',
    lead: 'Visas and immigration, commercial licences and renewals, amendments, share capital and share transfers, labour files, social security and trademarks.',
    body: 'Our government relations team handles the submissions, follow-ups and collections with each ministry and authority, so nothing stalls and nothing expires.',
  },
  {
    title: 'Finance and Accounting',
    lead: 'Bookkeeping, financial reporting, HR administration and payroll, aligned with local accounting standards and labour law.',
    body: 'Accurate records, on-time filings and payroll that already accounts for social security contributions and end-of-service benefits.',
  },
  {
    title: 'Relocation Services',
    lead: 'Employee and office relocation, home search and school search for teams and families moving to the Gulf.',
    body: 'From visas and housing to school places and settling in, we make the move straightforward for your people and your operations.',
  },
];

export const countries = [
  {
    name: 'Kuwait',
    slug: 'kuwait',
    code: 'KW',
    intro: 'Kuwait allows up to 100% foreign ownership in most sectors under its Foreign Direct Investment Law. We handle formation, licensing and every government process that follows.',
    authorityList: ['Ministry of Commerce and Industry', 'Public Authority for Manpower', 'Ministry of Interior', 'Public Institution for Social Security', 'Public Authority for Civil Information', 'Kuwait Municipality', 'Ministry of Foreign Affairs', 'Ministry of Justice'],
    quickFacts: [
      { label: 'Typical company formation', value: 'About 1 week for straightforward cases' },
      { label: 'Common structure for foreign investors', value: 'Limited Liability Company (WLL)' },
      { label: 'Social security registration', value: 'PIFSS' },
    ],
    line: 'Company formation in about one week for straightforward cases.',
    authorities: 'Ministry of Commerce and Industry, Public Authority for Manpower, PIFSS',
  },
  {
    name: 'Qatar',
    slug: 'qatar',
    code: 'QA',
    intro: 'Qatar allows up to 100% foreign ownership in most sectors. We set up companies and branches, secure licences and visas, and keep your entity compliant year after year.',
    authorityList: ['Ministry of Commerce and Industry', 'Ministry of Labour', 'Ministry of Interior', 'General Tax Authority', 'General Retirement and Social Insurance Authority', 'Ministry of Municipality', 'Ministry of Foreign Affairs', 'Ministry of Justice'],
    quickFacts: [
      { label: 'Typical company formation', value: '2 to 4 weeks for straightforward cases' },
      { label: 'Common structure for foreign investors', value: 'Limited Liability Company (LLC)' },
      { label: 'Social insurance registration', value: 'GRSIA' },
    ],
    line: 'Up to 100% foreign ownership in most sectors, with local partners where required.',
    authorities: 'Ministry of Commerce and Industry, Ministry of Interior, social insurance registration',
  },
  {
    name: 'Saudi Arabia',
    slug: 'saudi-arabia',
    code: 'SA',
    intro: 'From company formation and GRO services to GOSI registration and industrial licences, we guide foreign and local businesses through every step in the Kingdom.',
    authorityList: ['Ministry of Commerce', 'Ministry of Human Resources and Social Development', 'Ministry of Interior', 'Zakat, Tax and Customs Authority', 'General Organization for Social Insurance', 'Ministry of Industry and Mineral Resources', 'Ministry of Foreign Affairs', 'Ministry of Justice'],
    quickFacts: [
      { label: 'Government relations', value: 'Full GRO services' },
      { label: 'Social insurance registration', value: 'GOSI' },
      { label: 'Also available', value: 'Industrial licences and permits' },
    ],
    line: 'Setup, GRO services, GOSI registration and industrial licences.',
    authorities: 'Ministry of Commerce, GOSI, industrial licensing and permits',
  },
];

/** Messages from the current site's country home pages, reused for every country. */
export const countryPromises = [
  { title: 'Setting up a business doesn’t have to be difficult', text: (c: string) => `There are a number of options available to foreign individuals and companies to establish a business presence in ${c}. AEON Gulf can assist in such establishment.` },
  { title: 'We help you navigate the maze of government agencies', text: () => 'We make it our business to simplify and facilitate the process of dealing with all government agencies, making your life easier.' },
  { title: 'AEON Gulf is a leading business setup company', text: () => 'Our team of experts offer advice on all processes and procedures involved in setting up your business. We also provide silent shareholder and silent agent services, tapping into a long-established network of business contacts.' },
];

export const authorities = [
  'Ministry of Commerce and Industry',
  'Public Authority for Manpower',
  'Ministry of Interior',
  'Public Institution for Social Security',
  'GOSI',
  'Public Authority for Civil Information',
  'Municipality',
  'Ministry of Foreign Affairs',
  'Ministry of Justice',
];

export const stages = [
  { title: 'Set up', text: 'Choose the right structure, register the entity, open the labour file and bank account.' },
  { title: 'Operate', text: 'Visas, licence renewals, signatories, social security and annual compliance, handled on schedule.' },
  { title: 'Grow and change', text: 'Amendments, capital changes, share transfers, new activities and new addresses.' },
];

export const highlightServices = [
  { title: 'Company formation', text: 'Structure, registration, licensing and activation, including the first corporate bank account.', icon: 'formation' },
  { title: 'Visa and immigration', text: 'Work and family visas, residency permits, renewals and cancellations with the Ministry of Interior.', icon: 'visa' },
  { title: 'Licence renewals', text: 'Renewal calendars and early processing, so licences never lapse and files are never blocked.', icon: 'renewal' },
  { title: 'Liquidation and deregistration', text: 'Orderly closure of companies and branches, from clearances to final deregistration.', icon: 'closure' },
];

/** Figures we can state from the content we have. Confirm with AEON Gulf before launch. */
export const numbers = [
  { value: '3', suffix: '', label: 'Gulf markets: Kuwait, Qatar and Saudi Arabia' },
  { value: '32', suffix: '+', label: 'Services available in each market' },
  { value: '10', suffix: '+', label: 'Years working with the GCC business community' },
  { value: '4', suffix: '', label: 'Service groups under one partner' },
];

export const testimonials = [
  { topic: 'Company formation, Kuwait', quote: 'Client testimonial to be supplied by AEON Gulf.', name: 'Client name', role: 'Role, company', placeholder: true },
  { topic: 'Annual compliance, Qatar', quote: 'Client testimonial to be supplied by AEON Gulf.', name: 'Client name', role: 'Role, company', placeholder: true },
  { topic: 'GRO services, Saudi Arabia', quote: 'Client testimonial to be supplied by AEON Gulf.', name: 'Client name', role: 'Role, company', placeholder: true },
  { topic: 'Employee relocation, Kuwait', quote: 'Client testimonial to be supplied by AEON Gulf.', name: 'Client name', role: 'Role, company', placeholder: true },
];

// Guides live in ./insights.ts


export const values = [
  { title: 'Integrity', text: 'We tell clients what a process really involves, what it costs and how long it takes, before they commit.' },
  { title: 'Credibility', text: 'Long-standing relationships across the private and government sectors of the GCC, built over years of work.' },
  { title: 'Consistency', text: 'Our clients know us for being consistent, reliable and predictable, filing after filing.' },
  { title: 'Partnership', text: 'We turn business relationships into partnerships that support your growth across the region.' },
];
