/**
 * Photography. Images from the client's current site (aeon.qrq8.com) plus three free-licence
 * Unsplash photos where the old site had nothing suitable. The homepage banner is the current
 * site's main banner, as requested; other old-site photos of non-Gulf skylines were left out.
 *
 * By default images load from their original URLs. `npm run dev` / `npm run build` download them into /public/images
 * first (scripts/fetch-assets.mjs); once all are present the site serves its own copies automatically.
 */
const OLD_SITE = 'https://aeon.qrq8.com';
const local = process.env.NEXT_PUBLIC_LOCAL_IMAGES === '1';

type Source = { key: string; remote: string; alt: string; credit?: string };

const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=2000&q=75&auto=format&fit=crop`;

export const sources = {
  landingBanner: { key: 'landing-banner.jpg', remote: `${OLD_SITE}/wp-content/uploads/2025/03/landing_banner.jpg`, alt: 'City skyline at dusk (main banner from the current site)' },
  kuwaitNight: { key: 'kuwait-night.jpg', remote: `${OLD_SITE}/wp-content/uploads/2024/12/kwt_journey.jpeg`, alt: 'Kuwait City skyline at night' },
  kuwaitBanner: { key: 'kuwait-banner.jpg', remote: `${OLD_SITE}/kuwait/wp-content/uploads/sites/2/2024/12/kwt_banner.jpg`, alt: 'Kuwait City skyline across the bay at dusk' },
  kuwaitCard: { key: 'kuwait-card.jpg', remote: `${OLD_SITE}/wp-content/uploads/2025/03/kuwait.jpg`, alt: 'Kuwait City towers at sunset' },
  hamraTower: { key: 'al-hamra-tower.jpg', remote: `${OLD_SITE}/kuwait/wp-content/uploads/sites/2/2025/01/hero3.jpg`, alt: 'Al Hamra Tower, Kuwait City' },
  qatarBanner: { key: 'doha-banner.jpg', remote: `${OLD_SITE}/qatar/wp-content/uploads/sites/7/2025/07/qa_banner.jpg`, alt: 'Doha skyline lit at night' },
  qatarCard: { key: 'doha-card.jpg', remote: `${OLD_SITE}/wp-content/uploads/2025/03/qatar.jpg`, alt: 'Doha towers at night' },
  riyadhNight: { key: 'riyadh-night.jpg', remote: unsplash('photo-1663900108404-a05e8bf82cda'), alt: 'Riyadh skyline at night', credit: 'Unsplash' },
  riyadhDay: { key: 'riyadh-faisaliah.jpg', remote: unsplash('photo-1784637729389-f24e1d2a8b22'), alt: 'Al Faisaliah Tower, Riyadh', credit: 'Unsplash' },
  boardroom: { key: 'boardroom.jpg', remote: `${OLD_SITE}/kuwait/wp-content/uploads/sites/2/2025/01/hero2.jpg`, alt: 'Empty boardroom with a long meeting table' },
  futureGulf: { key: 'gulf-business.jpg', remote: `${OLD_SITE}/kuwait/wp-content/uploads/sites/2/2025/04/Your-Future-with-Aeon.jpg`, alt: 'Two Gulf businessmen talking on a city promenade' },
  team: { key: 'team-meeting.jpg', remote: `${OLD_SITE}/wp-content/uploads/2024/12/about_us.jpg`, alt: 'A team meeting around a shared table' },
  teamContact: { key: 'team-office.jpg', remote: `${OLD_SITE}/kuwait/wp-content/uploads/sites/2/2024/12/contact_us.jpg`, alt: 'Colleagues talking in a bright office' },
  corporate: { key: 'corporate.jpg', remote: `${OLD_SITE}/wp-content/uploads/2024/12/corporate_service.jpg`, alt: 'A businessman in a suit at a meeting' },
  relocation: { key: 'relocation.jpg', remote: `${OLD_SITE}/wp-content/uploads/2024/12/relocation_service.jpg`, alt: 'A person carrying a moving box with a plant' },
  conference: { key: 'conference.jpg', remote: `${OLD_SITE}/wp-content/uploads/2024/12/news1.jpg`, alt: 'Audience at a business conference' },
  documents: { key: 'documents.jpg', remote: unsplash('photo-1450101499163-c8848c66ca85'), alt: 'A person signing documents at a desk', credit: 'Unsplash' },
  accounting: { key: 'accounting.jpg', remote: unsplash('photo-1762427355235-dd22e5cb010c'), alt: 'Desk with a calculator, binders and notebooks', credit: 'Unsplash' },
} satisfies Record<string, Source>;

export type ImageKey = keyof typeof sources;

let overrides: Record<string, { src: string; alt?: string }> = {};

/** Called by the site layout (server) and the ImageOverrides provider (browser) with the admin's image choices. */
export function setImageOverrides(map: Record<string, { src: string; alt?: string }>) {
  overrides = map ?? {};
}

/** The built-in image for a slot, before any admin replacement. */
export function defaultImage(key: ImageKey) {
  const s: Source = sources[key];
  return { src: local ? `/images/${s.key}` : s.remote, alt: s.alt };
}

export function image(key: ImageKey) {
  const base = defaultImage(key);
  const o = overrides[key];
  return o?.src ? { src: o.src, alt: o.alt || base.alt } : base;
}

/** Image for a value that is either a slot key or a full URL (guides can use either). */
export function imageFor(value: string, alt = '') {
  return value in sources ? image(value as ImageKey) : { src: value, alt };
}

export const countryImages = {
  kuwait: { banner: 'kuwaitBanner', card: 'kuwaitCard' },
  qatar: { banner: 'qatarBanner', card: 'qatarCard' },
  'saudi-arabia': { banner: 'riyadhNight', card: 'riyadhDay' },
} as const satisfies Record<string, { banner: ImageKey; card: ImageKey }>;

export const groupImages = {
  corporate: 'corporate',
  pro: 'documents',
  finance: 'accounting',
  relocation: 'relocation',
} as const satisfies Record<string, ImageKey>;
