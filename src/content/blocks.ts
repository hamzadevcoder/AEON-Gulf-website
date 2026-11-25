/**
 * Editable page sections. Each block lists its fields (which drive the admin form) and its default
 * content (today's website text). Stored values in `content_blocks` are merged over the defaults, so
 * adding a new field later never breaks existing content.
 */
import { serviceGroups, authorities, stages, highlightServices, numbers, testimonials, values, countryPromises } from './site';

export type Field =
  | { name: string; label: string; type: 'text' | 'textarea'; help?: string; max?: number }
  | { name: string; label: string; type: 'image'; help?: string }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: 'list'; itemLabel: string; fields: { name: string; label: string; type: 'text' | 'textarea' }[]; min?: number; max?: number };

export type BlockDef = { key: string; page: string; title: string; description: string; fields: Field[]; defaults: Record<string, unknown> };

const t = (name: string, label: string, help?: string): Field => ({ name, label, type: 'text', help });
const ta = (name: string, label: string, help?: string): Field => ({ name, label, type: 'textarea', help });

export const blockDefs: BlockDef[] = [
  // ---------------------------------------------------------------- Home
  {
    key: 'home.hero', page: 'Home', title: 'Hero banner', description: 'The full-screen banner at the top of the homepage.',
    fields: [t('eyebrow', 'Small line above the heading'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line (grey)'), t('primaryLabel', 'First button'), t('secondaryLabel', 'Second button'), ta('cardText', 'Floating card text'), t('cardLinkLabel', 'Floating card link')],
    defaults: {
      eyebrow: 'We help businesses succeed in Kuwait, Saudi Arabia and Qatar, faster and with less friction.',
      title: 'Your company in the Gulf,', titleSoft: 'set up and kept compliant.', primaryLabel: 'Our services', secondaryLabel: 'Get a quote',
      cardText: 'A new company in Kuwait in about one week, for straightforward cases.', cardLinkLabel: 'Services in Kuwait',
    },
  },
  {
    key: 'home.who', page: 'Home', title: 'Who we are', description: 'Introduction below the banner.',
    fields: [t('eyebrow', 'Label'), ta('statement', 'Statement (large text)'), ta('body', 'Paragraph'), t('buttonLabel', 'Button')],
    defaults: {
      eyebrow: 'Who we are',
      statement: 'AEON Gulf is owned and managed by Kuwaiti nationals and expatriates with years of experience in the GCC business community and strong relationships across the private and government sectors.',
      body: 'With deep-rooted local expertise and a high-performance service model, we remove regulatory hurdles and bring clarity to complex processes. Integrity, credibility and honesty are our core values, and our clients know us for our consistency, reliability and predictability.',
      buttonLabel: 'About us',
    },
  },
  {
    key: 'home.services', page: 'Home', title: 'Our services', description: 'The four service groups with the large rolling numbers.',
    fields: [t('eyebrow', 'Label'), ta('statement', 'Statement'), t('buttonLabel', 'Button'), { name: 'groups', label: 'Service groups', type: 'list', itemLabel: 'Group', min: 1, max: 8, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'lead', label: 'First paragraph', type: 'textarea' }, { name: 'body', label: 'Second paragraph', type: 'textarea' }] }],
    defaults: {
      eyebrow: 'Our services', statement: 'From the first licence to the last filing, we cover the full life of your company in Kuwait, Qatar and Saudi Arabia.',
      buttonLabel: 'Explore all services', groups: serviceGroups,
    },
  },
  {
    key: 'home.countries', page: 'Home', title: 'Where we work', description: 'Intro beside the country cards (card text is edited under Countries).',
    fields: [t('eyebrow', 'Label'), ta('heading', 'Heading'), ta('text', 'Paragraph'), t('buttonLabel', 'Button')],
    defaults: { eyebrow: 'Where we work', heading: 'Three Gulf markets, one partner who knows each of them.', text: 'Local teams and established relationships with the authorities in Kuwait, Qatar and Saudi Arabia.', buttonLabel: 'Talk to our team' },
  },
  {
    key: 'home.authorities', page: 'Home', title: 'Authorities strip', description: 'Statement with the scrolling list of authorities.',
    fields: [t('eyebrow', 'Label'), ta('statement', 'Statement'), t('caption', 'Caption'), { name: 'items', label: 'Authorities', type: 'list', itemLabel: 'Authority', min: 1, max: 30, fields: [{ name: 'name', label: 'Name', type: 'text' }] }],
    defaults: {
      eyebrow: 'Why companies work with AEON Gulf', statement: 'We deal with the ministries and authorities every day, so your applications move without you chasing them.',
      caption: 'Some of the authorities our PRO and GRO teams work with across the region.', items: authorities.map((name) => ({ name })),
    },
  },
  {
    key: 'home.lifecycle', page: 'Home', title: 'Company lifecycle (dark section)', description: 'Statement, stage cards, quote and highlighted services.',
    fields: [
      t('title1', 'Heading, line 1'), t('title2', 'Heading, line 2 (grey)'), t('title3', 'Heading, line 3'), t('asideHeading', 'Side heading'), ta('asideText', 'Side paragraph'), t('buttonLabel', 'Button'),
      { name: 'stages', label: 'Stage cards', type: 'list', itemLabel: 'Stage', min: 1, max: 3, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }] },
      ta('quote', 'Quote'),
      { name: 'highlights', label: 'Highlighted services', type: 'list', itemLabel: 'Service', min: 1, max: 6, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }] },
    ],
    defaults: {
      title1: 'We look after your company', title2: 'at every stage of its life', title3: 'in the Gulf.',
      asideHeading: 'Set up, operate, grow and, when the time comes, close properly.',
      asideText: 'One partner for formation, government relations, accounting and relocation means fewer handovers and nothing falling between providers.',
      buttonLabel: 'Our services', stages,
      quote: '“A missed renewal can block a company’s labour file or commercial licence until it is put right. Our job is to make sure that never happens to yours.”',
      highlights: highlightServices.map(({ title, text }) => ({ title, text })),
    },
  },
  {
    key: 'home.numbers', page: 'Home', title: 'Numbers', description: 'Counters on the charcoal band.',
    fields: [t('eyebrow', 'Label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line (grey)'), ta('text', 'Paragraph'), { name: 'stats', label: 'Counters', type: 'list', itemLabel: 'Counter', min: 1, max: 4, fields: [{ name: 'value', label: 'Number (digits only)', type: 'text' }, { name: 'suffix', label: 'Suffix (e.g. +)', type: 'text' }, { name: 'label', label: 'Label', type: 'text' }] }],
    defaults: {
      eyebrow: 'AEON Gulf in numbers', title: 'Local expertise', titleSoft: 'across three Gulf markets.',
      text: 'We combine on-the-ground teams with long-standing government relationships, so applications move and deadlines are met.', stats: numbers,
    },
  },
  {
    key: 'home.testimonials', page: 'Home', title: 'Testimonials', description: 'Client quotes slider.',
    fields: [t('eyebrow', 'Label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line'), ta('intro', 'Intro (leave empty to hide)'), { name: 'items', label: 'Testimonials', type: 'list', itemLabel: 'Testimonial', min: 1, max: 10, fields: [{ name: 'topic', label: 'Topic label', type: 'text' }, { name: 'quote', label: 'Quote', type: 'textarea' }, { name: 'name', label: 'Client name', type: 'text' }, { name: 'role', label: 'Role, company', type: 'text' }] }],
    defaults: {
      eyebrow: 'Client stories', title: 'Trusted by companies', titleSoft: 'across the Gulf',
      intro: 'Testimonials below are placeholders until AEON Gulf supplies approved client quotes.',
      items: testimonials.map(({ topic, quote, name, role }) => ({ topic, quote, name, role })),
    },
  },
  {
    key: 'home.insights', page: 'Home', title: 'Insights', description: 'Guides section heading (the guides themselves are edited under Guides).',
    fields: [t('eyebrow', 'Label'), t('heading', 'Heading'), t('buttonLabel', 'Button')],
    defaults: { eyebrow: 'Insights', heading: 'Practical guides to doing business in the Gulf.', buttonLabel: 'All guides' },
  },
  // ---------------------------------------------------------------- About
  {
    key: 'about.page', page: 'About', title: 'About page', description: 'All text on the Our Company page.',
    fields: [
      t('eyebrow', 'Label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line (grey)'), ta('lead', 'Introduction'),
      t('missionEyebrow', 'Mission label'), ta('mission', 'Mission statement'),
      t('valuesEyebrow', 'Values label'), t('valuesHeading', 'Values heading'), ta('valuesText', 'Values paragraph'),
      { name: 'values', label: 'Values (stacking cards)', type: 'list', itemLabel: 'Value', min: 1, max: 6, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }] },
      t('ctaTitle', 'Closing heading, first line'), t('ctaTitleSoft', 'Closing heading, second line'), ta('ctaText', 'Closing paragraph'),
    ],
    defaults: {
      eyebrow: 'Our company', title: 'The AEON Gulf Story,', titleSoft: 'Innovation in Motion.',
      lead: 'The company is owned and managed by a group of Kuwaiti nationals and expatriates, who bring together years of experience in dealing with the GCC business community combined with strong relationships across both the private and government sectors. We are passionate about what we do and how we do it.',
      missionEyebrow: 'Our mission',
      mission: 'From company formation and visa support to a full suite of PRO and administrative services, we make it easy to establish and grow your operations in the Gulf. Our mission is simple: to empower your business to focus on what matters most, expansion and achieving long-term success.',
      valuesEyebrow: 'Why choose us', valuesHeading: 'Built on integrity, credibility and honesty.',
      valuesText: 'Our clients know us for our consistency, reliability and predictability. These are the principles behind every filing we make.',
      values, ctaTitle: 'Start your journey', ctaTitleSoft: 'with AEON Gulf.',
      ctaText: 'Explore new opportunities and set up your business in the heart of the Gulf region. With our presence across Kuwait, Saudi Arabia and Qatar, AEON Gulf is positioned to guide you every step of the way, providing local expertise with regional perspective.',
    },
  },
  // ---------------------------------------------------------------- Services, countries
  {
    key: 'services.hub', page: 'Services', title: 'Services page', description: 'Hero and closing text on /services.',
    fields: [t('eyebrow', 'Label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line'), ta('subtitle', 'Subtitle ({count} = number of services)'), t('ctaHeading', 'Closing heading'), ta('ctaText', 'Closing paragraph')],
    defaults: {
      eyebrow: 'Our services', title: 'Everything your company needs', titleSoft: 'in Kuwait, Qatar and Saudi Arabia.',
      subtitle: '{count} services across three markets, from first registration to the final filing. Choose a country to see the services available there.',
      ctaHeading: 'Not sure which service you need?', ctaText: 'Tell us what you are planning and we will map out the steps, timeline and cost for your market.',
    },
  },
  {
    key: 'country.common', page: 'Countries', title: 'Country pages: shared text', description: 'Text used on every country page. {country} is replaced with the country name.',
    fields: [t('title', 'Hero heading, first line'), t('titleSoft', 'Hero heading, second line ({country})'), ta('statement', 'Intro statement ({country})'), t('promisesHeading', '"How we help" heading ({country})'), { name: 'promises', label: '"How we help" points', type: 'list', itemLabel: 'Point', min: 1, max: 6, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text ({country})', type: 'textarea' }] }],
    defaults: {
      title: 'Setting up in', titleSoft: '{country} doesn’t have to be difficult.',
      statement: 'We deal with {country}’s ministries and authorities every day, so your registrations, licences and visas move without you chasing them.',
      promisesHeading: 'How we help you in {country}',
      promises: countryPromises.map((p) => ({ title: p.title, text: p.text('{country}') })),
    },
  },
  // ---------------------------------------------------------------- Contact, quote, footer
  {
    key: 'contact.page', page: 'Contact', title: 'Contact page', description: 'Heading and introduction on /contact.',
    fields: [t('eyebrow', 'Label'), t('heading', 'Heading'), ta('lead', 'Introduction')],
    defaults: { eyebrow: 'Contact us', heading: 'We’d love to hear from you.', lead: 'Your next step is just a message away. Send us a few details and we will come back with the steps, timeline and a quote for your situation.' },
  },
  {
    key: 'quote.page', page: 'Get a quote', title: 'Quote page', description: 'Heading, introduction and "what happens next" steps on /quote.',
    fields: [t('eyebrow', 'Label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line'), ta('lead', 'Introduction'), { name: 'steps', label: 'What happens next', type: 'list', itemLabel: 'Step', min: 1, max: 5, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }] }],
    defaults: {
      eyebrow: 'Get a quote', title: 'A tailored quote is', titleSoft: 'just one click away.',
      lead: 'Tell us about your company and what you need in Kuwait, Qatar or Saudi Arabia, and we will come back with a quote built around your situation.',
      steps: [
        { title: 'We review your request', text: 'Our team looks at your country, activity and the services you need.' },
        { title: 'We confirm the details', text: 'We get in touch to clarify anything that affects timing or cost.' },
        { title: 'You receive a tailored quote', text: 'A clear breakdown of steps, timeline and fees for your situation.' },
      ],
    },
  },
  {
    key: 'footer', page: 'Site-wide', title: 'Footer', description: 'Footer text.',
    fields: [ta('blurb', 'Company description'), t('tagline', 'Tagline (bottom right)'), t('newsletterLabel', 'Newsletter label')],
    defaults: {
      blurb: 'AEON Gulf is a business setup and corporate services company owned and managed by Kuwaiti nationals and expatriates, working across Kuwait, Qatar and Saudi Arabia.',
      tagline: 'Corporate services, PRO and GRO across the Gulf', newsletterLabel: 'Get updates on Gulf business regulations.',
    },
  },
];

export const blockDef = (key: string) => blockDefs.find((b) => b.key === key);

/** The built-in pages shown in the dashboard's Pages list, and which blocks belong to each. */
export const builtinPages = [
  { slug: 'home', name: 'Home', url: '/', group: 'Home', description: 'Banner, services, countries, numbers, testimonials and guides.' },
  { slug: 'about', name: 'About us', url: '/about', group: 'About', description: 'Company story, mission, values and closing call to action.' },
  { slug: 'services', name: 'Services page', url: '/services', group: 'Services', description: 'Heading and closing text of the all-services page.' },
  { slug: 'countries', name: 'Country pages (shared text)', url: '/kuwait', group: 'Countries', description: 'Text shared by the Kuwait, Qatar and Saudi Arabia pages. Each country’s own details are under Countries.' },
  { slug: 'contact', name: 'Contact', url: '/contact', group: 'Contact', description: 'Heading and introduction of the contact page.' },
  { slug: 'quote', name: 'Get a quote', url: '/quote', group: 'Get a quote', description: 'Heading, introduction and “what happens next” steps.' },
  { slug: 'footer', name: 'Footer (every page)', url: '/', group: 'Site-wide', description: 'Company description and tagline shown at the bottom of every page.' },
] as const;
export const builtinPage = (slug: string) => builtinPages.find((p) => p.slug === slug);
export const builtinSlugForGroup = (group: string) => builtinPages.find((p) => p.group === group)?.slug ?? 'home';

/** Replace {country} / {count} placeholders. */
export const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// Typed views of each block for the components.
type Item<T extends string> = Record<T, string>;
export type Blocks = {
  'home.hero': Item<'eyebrow' | 'title' | 'titleSoft' | 'primaryLabel' | 'secondaryLabel' | 'cardText' | 'cardLinkLabel'>;
  'home.who': Item<'eyebrow' | 'statement' | 'body' | 'buttonLabel'>;
  'home.services': Item<'eyebrow' | 'statement' | 'buttonLabel'> & { groups: Item<'title' | 'lead' | 'body'>[] };
  'home.countries': Item<'eyebrow' | 'heading' | 'text' | 'buttonLabel'>;
  'home.authorities': Item<'eyebrow' | 'statement' | 'caption'> & { items: Item<'name'>[] };
  'home.lifecycle': Item<'title1' | 'title2' | 'title3' | 'asideHeading' | 'asideText' | 'buttonLabel' | 'quote'> & { stages: Item<'title' | 'text'>[]; highlights: Item<'title' | 'text'>[] };
  'home.numbers': Item<'eyebrow' | 'title' | 'titleSoft' | 'text'> & { stats: Item<'value' | 'suffix' | 'label'>[] };
  'home.testimonials': Item<'eyebrow' | 'title' | 'titleSoft' | 'intro'> & { items: Item<'topic' | 'quote' | 'name' | 'role'>[] };
  'home.insights': Item<'eyebrow' | 'heading' | 'buttonLabel'>;
  'about.page': Item<'eyebrow' | 'title' | 'titleSoft' | 'lead' | 'missionEyebrow' | 'mission' | 'valuesEyebrow' | 'valuesHeading' | 'valuesText' | 'ctaTitle' | 'ctaTitleSoft' | 'ctaText'> & { values: Item<'title' | 'text'>[] };
  'services.hub': Item<'eyebrow' | 'title' | 'titleSoft' | 'subtitle' | 'ctaHeading' | 'ctaText'>;
  'country.common': Item<'title' | 'titleSoft' | 'statement' | 'promisesHeading'> & { promises: Item<'title' | 'text'>[] };
  'contact.page': Item<'eyebrow' | 'heading' | 'lead'>;
  'quote.page': Item<'eyebrow' | 'title' | 'titleSoft' | 'lead'> & { steps: Item<'title' | 'text'>[] };
  footer: Item<'blurb' | 'tagline' | 'newsletterLabel'>;
};
export type BlockKey = keyof Blocks;
