import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { GuideCard } from '@/components/sections/insights/GuideCard';
import type { Blocks } from '@/content/blocks';
import type { Guide } from '@/server/content';

export function Insights({ text, guides }: { text: Blocks['home.insights']; guides: Guide[] }) {
  return (
    <section id="insights" className="section tone-white insights" aria-labelledby="ins-title">
      <div className="grid4 insights__head">
        <div className="insights__title">
          <Eyebrow>{text.eyebrow}</Eyebrow>
          <h2 id="ins-title" className="sr-only">
            {text.eyebrow}
          </h2>
          <ScrubText className="h-big" as="p">
            {text.heading}
          </ScrubText>
        </div>
        <div className="insights__all">
          <Button href="/insights">{text.buttonLabel}</Button>
        </div>
      </div>
      <Fade className="insights__grid" childrenStagger>
        {guides.map((g) => (
          <GuideCard key={g.slug} guide={g} />
        ))}
      </Fade>
    </section>
  );
}
