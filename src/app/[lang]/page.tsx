import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo';
import { Hero } from '@/components/sections/home/Hero';
import { WhoWeAre } from '@/components/sections/home/WhoWeAre';
import { Solutions } from '@/components/sections/home/Solutions';
import { Countries } from '@/components/sections/home/Countries';
import { Authorities } from '@/components/sections/home/Authorities';
import { Lifecycle } from '@/components/sections/home/Lifecycle';
import { Numbers } from '@/components/sections/home/Numbers';
import { Testimonials } from '@/components/sections/home/Testimonials';
import { Insights } from '@/components/sections/home/Insights';
import { getBlock, getCountries, getGuides } from '@/server/content';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  setLocale(lang);
  const t = await getT();
  return pageMetadata({ title: t('meta.home.title'), description: t('meta.home.desc'), path: '/', absoluteTitle: true });
}

export default async function HomePage({ params }: P) {
  setLocale((await params).lang);
  const t = await getT();
  const [hero, who, services, countriesText, authorities, lifecycle, numbers, testimonials, insights, countries, guides] = await Promise.all([
    getBlock('home.hero'), getBlock('home.who'), getBlock('home.services'), getBlock('home.countries'), getBlock('home.authorities'),
    getBlock('home.lifecycle'), getBlock('home.numbers'), getBlock('home.testimonials'), getBlock('home.insights'), getCountries(), getGuides(),
  ]);
  return (
    <>
      <Hero text={hero} />
      <WhoWeAre text={who} />
      <Solutions text={services} />
      <Countries text={countriesText} countries={countries} />
      <Authorities text={authorities} />
      <Lifecycle text={lifecycle} />
      <Numbers text={numbers} />
      <Testimonials text={testimonials} />
      {guides.length > 0 && <Insights text={insights} guides={guides} />}
    </>
  );
}
