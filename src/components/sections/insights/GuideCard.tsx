import { TransitionLink } from '@/components/motion/TransitionLink';
import { getT } from '@/i18n/server';
import { Photo } from '@/components/ui/Photo';
import { imageFor } from '@/content/images';
import { guidePath } from '@/content/insights';
import type { Guide } from '@/server/content';

/** Guide card; the whole card links to the guide. */
export async function GuideCard({ guide: g }: { guide: Guide }) {
  const t = await getT();
  return (
    <TransitionLink href={guidePath(g)} className="post-card">
      <Photo {...imageFor(g.image, g.title)} className="post-card__media" />
      <p className="post-card__meta">
        {g.category} / {g.countryName} / {t('guide.readMin', { n: g.readMinutes })}
      </p>
      <h3 className="h-card">{g.title}</h3>
      <p className="post-card__excerpt">{g.excerpt}</p>
      <span className="btn btn--white post-card__btn">
        <span className="roll" aria-hidden="true">
          <span>{t('guide.read')}</span>
          <span>{t('guide.read')}</span>
        </span>
        <span className="sr-only">{t('guide.read')}</span>
      </span>
    </TransitionLink>
  );
}
