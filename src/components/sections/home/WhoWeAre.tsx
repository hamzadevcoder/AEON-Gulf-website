import { Stairs } from '@/components/motion/Stairs';
import { ScrubText } from '@/components/motion/ScrubText';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { image } from '@/content/images';

import type { Blocks } from '@/content/blocks';

export function WhoWeAre({ text }: { text: Blocks['home.who'] }) {
  return (
    <section className="section tone-white who" aria-labelledby="who-title">
      <Stairs />
      <div className="grid4">
        <div className="who__side">
          <Eyebrow>{text.eyebrow}</Eyebrow>
          <Photo {...image('futureGulf')} reveal className="who__photo" />
        </div>
        <div className="who__main">
          <h2 id="who-title" className="sr-only">
            {text.eyebrow}
          </h2>
          <ScrubText className="h-statement">{text.statement}</ScrubText>
          <Fade className="who__body">
            <p>{text.body}</p>
            <Button href="/about">{text.buttonLabel}</Button>
          </Fade>
        </div>
      </div>
    </section>
  );
}
