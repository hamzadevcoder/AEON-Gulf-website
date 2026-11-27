import type { Metadata } from 'next';
import { setLocale, getT } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Button';
import { ContactForm } from '@/components/sections/contact/ContactForm';
import { getBlock, getContact } from '@/server/content';

type P = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  setLocale(lang);
  const tr = await getT();
  return pageMetadata({ title: tr('meta.contact.title'), description: tr('meta.contact.desc'), path: '/contact', absoluteTitle: true });
}

export default async function ContactPage({ params }: P) {
  setLocale((await params).lang);
  const tr = await getT();
  const [t, contact] = await Promise.all([getBlock('contact.page'), getContact()]);
  return (
    <section className="section tone-white contact" aria-labelledby="contact-title">
      <div className="grid4">
        <div className="contact__intro">
          <Fade load y={20}>
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </Fade>
          <SplitReveal as="h1" load className="h-statement" id="contact-title">
            {t.heading}
          </SplitReveal>
          <Fade load as="p" className="contact__lead" delay={0.2}>
            {t.lead}
          </Fade>
          <Fade load className="contact__details" childrenStagger delay={0.3}>
            <div>
              <p className="eyebrow eyebrow--small">{tr('common.email')}</p>
              <a href={`mailto:${contact.email}`}>
                <ArrowIcon /> {contact.email}
              </a>
            </div>
            <div>
              <p className="eyebrow eyebrow--small">{tr('common.phone')}</p>
              <a href={contact.phoneHref}>
                <ArrowIcon /> {contact.phone}
              </a>
            </div>
            {contact.offices.map((o) => (
              <div key={o.country}>
                <p className="eyebrow eyebrow--small">{o.country}</p>
                <p>{o.detail}</p>
                {o.phone && <a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}>{o.phone}</a>}
              </div>
            ))}
          </Fade>
        </div>
        <Fade load className="contact__form-wrap" delay={0.25}>
          <ContactForm />
        </Fade>
      </div>
    </section>
  );
}
