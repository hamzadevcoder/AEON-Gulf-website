import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Button, ArrowLink } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { image } from '@/content/images';
import { HeroSlides } from './HeroSlides';

/** Black full-screen hero. The reference runs background video here; drop AEON footage into .hero__media. */
import type { Blocks } from '@/content/blocks';

export function Hero({ text }: { text: Blocks['home.hero'] }) {
  return (
    <section className="section tone-black hero" data-tone="dark" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        {/* Swap for <video autoPlay muted loop playsInline poster=…> if AEON supplies footage. */}
        <HeroSlides />
        <div className="hero__glow" />
      </div>
      <div className="hero__top">
        <Fade load as="p" className="hero__eyebrow" y={20} delay={0.1}>
          {text.eyebrow}
        </Fade>
        <SplitReveal as="h1" load className="h-hero" id="hero-title">
          {text.title}
          <br />
          <span className="tone-2">{text.titleSoft}</span>
        </SplitReveal>
      </div>
      <Fade load className="hero__actions" childrenStagger delay={0.35} y={24}>
        <Button href="/services" variant="light">
          {text.primaryLabel}
        </Button>
        <Button href="/quote" variant="dark">
          {text.secondaryLabel}
        </Button>
      </Fade>
      <Fade load className="hero__card" delay={0.55} y={40}>
        <Photo {...image('hamraTower')} className="hero__card-media" />
        <div className="hero__card-body">
          <p>{text.cardText}</p>
          <ArrowLink href="/kuwait">{text.cardLinkLabel}</ArrowLink>
        </div>
      </Fade>
    </section>
  );
}
