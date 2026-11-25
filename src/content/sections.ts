/**
 * Section templates for pages built in the dashboard. Each template lists its editable fields (which
 * drive the admin form) and starter content. The public site renders them in the existing design.
 */
import type { Field } from './blocks';

export type SectionTemplate = { type: string; name: string; description: string; icon: string; fields: Field[]; defaults: Record<string, unknown> };

const t = (name: string, label: string, help?: string): Field => ({ name, label, type: 'text', help });
const ta = (name: string, label: string, help?: string): Field => ({ name, label, type: 'textarea', help });
const img = (name: string, label: string, help?: string): Field => ({ name, label, type: 'image', help });
const bg = (def = 'white'): Field => ({
  name: 'tone', label: 'Background', type: 'select',
  options: [{ value: 'white', label: 'White' }, { value: 'ice', label: 'Light grey' }, { value: 'dark', label: 'Dark' }],
  help: def === 'white' ? undefined : undefined,
});
const link = (name: string, label: string): Field => ({ name, label, type: 'text', help: 'A page address such as /contact or /quote, or a full https:// link.' });

export const sectionTemplates: SectionTemplate[] = [
  {
    type: 'hero', name: 'Page banner', icon: '▭', description: 'Large dark banner with the page heading, short text, a photo and buttons. Use once, at the top.',
    fields: [t('eyebrow', 'Small label'), t('title', 'Heading'), t('titleSoft', 'Heading, second line (grey)'), ta('subtitle', 'Text under the heading'), img('image', 'Background photo'), t('buttonLabel', 'Button label'), link('buttonLink', 'Button link')],
    defaults: { eyebrow: 'AEON Gulf', title: 'A clear heading for this page', titleSoft: 'with a calm second line.', subtitle: 'One or two sentences that explain what this page is about.', image: 'boardroom', buttonLabel: 'Get a quote', buttonLink: '/quote' },
  },
  {
    type: 'statement', name: 'Statement with photo', icon: '❝', description: 'A large statement that fills in as you scroll, with a paragraph, button and photo.',
    fields: [bg(), t('eyebrow', 'Small label'), ta('statement', 'Large statement'), ta('body', 'Paragraph'), t('buttonLabel', 'Button label'), link('buttonLink', 'Button link'), img('image', 'Photo (optional)')],
    defaults: { tone: 'white', eyebrow: 'About this', statement: 'Write one confident sentence or two that sum up the point of this section.', body: 'Add a short paragraph with the detail behind the statement.', buttonLabel: '', buttonLink: '', image: '' },
  },
  {
    type: 'text', name: 'Text article', icon: '¶', description: 'Headings, paragraphs and bullet lists for longer explanations, such as guidance or terms.',
    fields: [bg(), t('eyebrow', 'Small label'), t('heading', 'Heading'), ta('body', 'Text', 'Leave a blank line between paragraphs. Start a line with “- ” for a bullet list, or “### ” for a sub-heading.')],
    defaults: { tone: 'white', eyebrow: 'Details', heading: 'Section heading', body: 'First paragraph.\n\nSecond paragraph.\n\n- A bullet point\n- Another bullet point' },
  },
  {
    type: 'cards', name: 'Cards', icon: '▦', description: 'A row of cards, each with a title, short text and optional link.',
    fields: [bg('ice'), t('eyebrow', 'Small label'), t('heading', 'Heading'), ta('intro', 'Introduction (optional)'), { name: 'columns', label: 'Cards per row', type: 'select', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
      { name: 'cards', label: 'Cards', type: 'list', itemLabel: 'Card', min: 1, max: 12, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }, { name: 'linkLabel', label: 'Link text (optional)', type: 'text' }, { name: 'link', label: 'Link address (optional)', type: 'text' }] }],
    defaults: { tone: 'ice', eyebrow: 'What we offer', heading: 'Three things worth knowing', intro: '', columns: '3', cards: [{ title: 'First point', text: 'A short explanation.', linkLabel: '', link: '' }, { title: 'Second point', text: 'A short explanation.', linkLabel: '', link: '' }, { title: 'Third point', text: 'A short explanation.', linkLabel: '', link: '' }] },
  },
  {
    type: 'list', name: 'Numbered list', icon: '≡', description: 'A heading with numbered rows: good for steps, benefits or requirements.',
    fields: [bg(), t('eyebrow', 'Small label'), t('heading', 'Heading'), { name: 'items', label: 'Rows', type: 'list', itemLabel: 'Row', min: 1, max: 12, fields: [{ name: 'title', label: 'Title', type: 'text' }, { name: 'text', label: 'Text', type: 'textarea' }] }],
    defaults: { tone: 'ice', eyebrow: 'How it works', heading: 'Simple steps', items: [{ title: 'Step one', text: 'What happens first.' }, { title: 'Step two', text: 'What happens next.' }, { title: 'Step three', text: 'How it finishes.' }] },
  },
  {
    type: 'faq', name: 'Questions and answers', icon: '?', description: 'An expandable FAQ list. Also helps Google show your answers in search results.',
    fields: [bg(), t('eyebrow', 'Small label'), t('heading', 'Heading'), { name: 'items', label: 'Questions', type: 'list', itemLabel: 'Question', min: 1, max: 20, fields: [{ name: 'q', label: 'Question', type: 'text' }, { name: 'a', label: 'Answer', type: 'textarea' }] }],
    defaults: { tone: 'white', eyebrow: 'Questions and answers', heading: 'Frequently asked questions', items: [{ q: 'A common question?', a: 'A clear, helpful answer.' }, { q: 'Another question?', a: 'Another answer.' }] },
  },
  {
    type: 'banner', name: 'Photo banner', icon: '▣', description: 'A full-width photo with a short message and a button over it.',
    fields: [img('image', 'Photo'), t('eyebrow', 'Small label'), ta('text', 'Message'), t('buttonLabel', 'Button label'), link('buttonLink', 'Button link')],
    defaults: { image: 'kuwaitBanner', eyebrow: 'AEON Gulf', text: 'A short message that stays with the reader.', buttonLabel: 'Get a quote', buttonLink: '/quote' },
  },
  {
    type: 'stats', name: 'Numbers', icon: '#', description: 'Counters that roll up to their number as the section scrolls into view.',
    fields: [t('eyebrow', 'Small label'), t('title', 'Heading, first line'), t('titleSoft', 'Heading, second line (grey)'), ta('text', 'Paragraph'),
      { name: 'stats', label: 'Counters', type: 'list', itemLabel: 'Counter', min: 1, max: 4, fields: [{ name: 'value', label: 'Number (digits only)', type: 'text' }, { name: 'suffix', label: 'Suffix (e.g. +)', type: 'text' }, { name: 'label', label: 'Label', type: 'text' }] }],
    defaults: { eyebrow: 'In numbers', title: 'A few facts', titleSoft: 'that matter.', text: 'One sentence introducing the numbers.', stats: [{ value: '3', suffix: '', label: 'Gulf markets' }, { value: '32', suffix: '+', label: 'Services in each market' }] },
  },
  {
    type: 'form', name: 'Enquiry form', icon: '✉', description: 'A quote or contact form next to a short introduction. Submissions appear under Inquiries.',
    fields: [t('eyebrow', 'Small label'), t('heading', 'Heading'), ta('text', 'Introduction'), { name: 'formType', label: 'Form', type: 'select', options: [{ value: 'quote', label: 'Quote request' }, { value: 'contact', label: 'Contact message' }] }],
    defaults: { eyebrow: 'Let’s start', heading: 'Tell us what you need', text: 'Share a few details and our team will come back to you.', formType: 'quote' },
  },
  {
    type: 'cta', name: 'Call to action', icon: '➜', description: 'A closing band with a heading, a sentence and one or two buttons.',
    fields: [t('eyebrow', 'Small label'), t('heading', 'Heading'), ta('text', 'Text'), t('primaryLabel', 'First button label'), link('primaryLink', 'First button link'), t('secondaryLabel', 'Second button label (optional)'), link('secondaryLink', 'Second button link')],
    defaults: { eyebrow: 'Let’s start', heading: 'Ready to begin?', text: 'Talk to our team about your plans in the Gulf.', primaryLabel: 'Get a quote', primaryLink: '/quote', secondaryLabel: 'Contact us', secondaryLink: '/contact' },
  },
];

export const sectionTemplate = (type: string) => sectionTemplates.find((s) => s.type === type);

/** Starting layouts offered when creating a page. */
export const pageStarters = [
  { key: 'blank', name: 'Blank page', description: 'Start empty and add sections yourself.', sections: [] as string[] },
  { key: 'standard', name: 'Standard page', description: 'Banner, text and a closing call to action.', sections: ['hero', 'text', 'cta'] },
  { key: 'landing', name: 'Service landing page', description: 'Banner, statement, cards, questions and an enquiry form.', sections: ['hero', 'statement', 'cards', 'faq', 'form'] },
];

/** Slugs that belong to the site itself and cannot be used for a custom page. */
export const reservedSlugs = [
  'about', 'about-us', 'services', 'quote', 'contact', 'contact-us', 'insights', 'privacy-policy', 'terms-and-conditions', 'cookies-policy',
  'kuwait', 'qatar', 'saudi-arabia', 'ksa', 'admin', 'api', 'uploads', 'sitemap', 'robots', 'brand', 'flags', 'fonts', 'images', 'opengraph-image', '_next', 'favicon',
];
