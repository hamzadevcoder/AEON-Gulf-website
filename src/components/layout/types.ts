export type ContactProps = { email: string; phone: string; phoneHref: string; offices: { country: string; slug: string; detail: string; phone: string | null }[] };
export type CountryLink = { slug: string; name: string; code: string };
