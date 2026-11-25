import type { Metadata } from 'next';
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

export const metadata: Metadata = pageMetadata({
  title: 'AEON Gulf | Business Setup in Kuwait, Qatar & Saudi Arabia',
  description:
    'Company formation, PRO and GRO services, annual compliance, accounting and relocation across Kuwait, Qatar and Saudi Arabia. Local experts, one partner.',
  path: '/',
  absoluteTitle: true,
});

export default async function HomePage() {
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
      <Insights text={insights} guides={guides} />
    </>
  );
}
