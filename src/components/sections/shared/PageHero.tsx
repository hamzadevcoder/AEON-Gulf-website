import { SplitReveal } from '@/components/motion/SplitReveal';
import { getT } from '@/i18n/server';
import { Fade } from '@/components/motion/Fade';
import { Photo } from '@/components/ui/Photo';
import { TransitionLink } from '@/components/motion/TransitionLink';

type Crumb = { label: string; href?: string };

type Props = {
  eyebrow: string;
  title: string;
  titleSoft?: string;
  subtitle?: string;
  image?: { src: string; alt: string };
  crumbs?: Crumb[];
  children?: React.ReactNode;
  aside?: React.ReactNode;
};

/** Dark full-bleed hero used by the services, country and service pages. */
export async function PageHero({ eyebrow, title, titleSoft, subtitle, image, crumbs, children, aside }: Props) {
  const t = await getT();
  return (
    <section className="section tone-black page-hero" data-tone="dark">
      {image && (
        <div className="page-hero__media" aria-hidden="true">
          <Photo src={image.src} alt="" parallax={0.18} priority className="page-hero__photo" tone="dark" />
          <div className="page-hero__shade" />
        </div>
      )}
      <div className="page-hero__inner">
        {crumbs && (
          <Fade load as="nav" className="crumbs" aria-label={t('common.breadcrumb')} y={14}>
            <ol>
              {crumbs.map((c, i) => (
                <li key={i}>{c.href ? <TransitionLink href={c.href}>{c.label}</TransitionLink> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </Fade>
        )}
        <Fade load as="p" className="page-hero__eyebrow eyebrow" y={20} delay={0.05}>
          {eyebrow}
        </Fade>
        <SplitReveal as="h1" load className="h-hero page-hero__title">
          {title}
          {titleSoft && (
            <>
              <br />
              <span className="tone-2">{titleSoft}</span>
            </>
          )}
        </SplitReveal>
        {subtitle && (
          <Fade load as="p" className="page-hero__sub" delay={0.25} y={24}>
            {subtitle}
          </Fade>
        )}
        {children && (
          <Fade load className="page-hero__actions" childrenStagger delay={0.35} y={24}>
            {children}
          </Fade>
        )}
      </div>
      {aside && (
        <Fade load className="page-hero__aside" delay={0.55} y={40}>
          {aside}
        </Fade>
      )}
    </section>
  );
}
