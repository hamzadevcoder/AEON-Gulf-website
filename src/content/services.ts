import data from './services.json';

export type Service = (typeof data)[number] & { /** false on the Arabic site when the full Arabic page has not been written yet */ translated?: boolean };
export type CountrySlug = 'kuwait' | 'qatar' | 'saudi-arabia';
export type GroupKey = 'corporate' | 'pro' | 'finance' | 'relocation';

export const services = data as Service[];

export const groupOrder: GroupKey[] = ['corporate', 'pro', 'finance', 'relocation'];

export const groupInfo: Record<GroupKey, { label: string; intro: string }> = {
  corporate: {
    label: 'Corporate Services',
    intro: 'Company and branch formation, commercial agencies, directors and nominees, registered office, signatories, escrow and powers of attorney.',
  },
  pro: {
    label: 'PRO and GRO Services',
    intro: 'Government relations: visas, licences, amendments, capital and share changes, labour files, social insurance, trademarks and closure.',
  },
  finance: {
    label: 'Finance and Accounting',
    intro: 'Bookkeeping, financial reporting, HR administration and payroll aligned with local standards and labour law.',
  },
  relocation: {
    label: 'Relocation Services',
    intro: 'Employee and office relocation, home search and school search for teams and families moving to the Gulf.',
  },
};

export const servicesFor = (list: Service[], country: string) => list.filter((s) => s.country === country);

export const findService = (list: Service[], country: string, slug: string) => list.find((s) => s.country === country && s.slug === slug);

export const servicePath = (s: Pick<Service, 'country' | 'slug'>) => `/${s.country}/services/${s.slug}`;

/** The same service in the other countries where it exists. */
export const siblings = (list: Service[], s: Service) => list.filter((x) => x.slug === s.slug && x.country !== s.country);

/** Other services in the same group and country. */
export const related = (list: Service[], s: Service, n = 3) => list.filter((x) => x.country === s.country && x.group === s.group && x.slug !== s.slug).slice(0, n);

/** One row per distinct service (by slug), with the countries it is offered in. */
export function catalogue(list: Service[]) {
  const map = new Map<string, { slug: string; name: string; group: GroupKey; body: string; countries: Service[] }>();
  for (const s of list) {
    const row = map.get(s.slug);
    if (row) row.countries.push(s);
    else map.set(s.slug, { slug: s.slug, name: s.name, group: s.group as GroupKey, body: s.listing.body, countries: [s] });
  }
  return [...map.values()];
}

/** "Annual Compliance Services in Kuwait" → ["Annual Compliance Services", "in Kuwait"] for two-tone headings. */
export function splitHeading(heading: string, countryName: string) {
  for (const marker of [` in ${countryName}`, ` في ${countryName}`]) {
    const i = heading.lastIndexOf(marker);
    if (i > 0) return [heading.slice(0, i), heading.slice(i + 1)];
  }
  return [heading, ''];
}
