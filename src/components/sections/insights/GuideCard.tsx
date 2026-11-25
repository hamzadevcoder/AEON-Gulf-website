import { TransitionLink } from '@/components/motion/TransitionLink';
import { Photo } from '@/components/ui/Photo';
import { imageFor } from '@/content/images';
import { guidePath } from '@/content/insights';
import type { Guide } from '@/server/content';

/** Guide card; the whole card links to the guide. */
export function GuideCard({ guide: g }: { guide: Guide }) {
  return (
    <TransitionLink href={guidePath(g)} className="post-card">
      <Photo {...imageFor(g.image, g.title)} className="post-card__media" />
      <p className="post-card__meta">
        {g.category} / {g.countryName} / {g.readMinutes} min read
      </p>
      <h3 className="h-card">{g.title}</h3>
      <p className="post-card__excerpt">{g.excerpt}</p>
      <span className="btn btn--white post-card__btn">
        <span className="roll" aria-hidden="true">
          <span>Read the guide</span>
          <span>Read the guide</span>
        </span>
        <span className="sr-only">Read the guide</span>
      </span>
    </TransitionLink>
  );
}
