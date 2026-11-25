'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, reducedMotion } from '@/lib/gsap';
import { Stairs } from '@/components/motion/Stairs';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Fade } from '@/components/motion/Fade';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { image, type ImageKey } from '@/content/images';

const cardImages: ImageKey[] = ['team', 'teamContact', 'corporate', 'relocation'];
import type { Blocks } from '@/content/blocks';

/** Slider of charcoal cards; the active card is fully lit, the rest are dimmed. */
export function Testimonials({ text }: { text: Blocks['home.testimonials'] }) {
  const testimonials = text.items;
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  // Start on the second card so there is a card on each side of the centred one.
  const [index, setIndex] = useState(Math.min(1, testimonials.length - 1));
  const max = testimonials.length - 1;
  const first = useRef(true);
  const drag = useRef<number | null>(null);

  /** Centre the active card in the viewport. */
  const place = (i: number, duration: number) => {
    const cards = gsap.utils.toArray<HTMLElement>('.t-card', track.current);
    const card = cards[i];
    if (!card || !track.current?.parentElement) return;
    const view = track.current.parentElement.clientWidth;
    gsap.to(track.current, { x: view / 2 - (card.offsetLeft + card.offsetWidth / 2), duration, ease: 'expo.out', overwrite: true });
    cards.forEach((c, n) => {
      c.classList.toggle('is-active', n === i);
      gsap.to(c, { opacity: n === i ? 1 : 0.35, scale: n === i ? 1 : 0.94, duration: duration * 0.7, ease: 'power2.out', overwrite: true });
    });
  };

  useGSAP(
    () => {
      place(index, first.current || reducedMotion() ? 0 : 0.9);
      first.current = false;
    },
    { dependencies: [index], scope: ref },
  );

  useEffect(() => {
    const onResize = () => place(index, 0);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <section ref={ref} className="section tone-white testimonials" aria-labelledby="t-title">
      <Stairs />
      <div className="testimonials__head">
        <Eyebrow className="center">{text.eyebrow}</Eyebrow>
        <SplitReveal as="h2" className="h-big center" id="t-title">
          {text.title}
          <br />
          {text.titleSoft}
        </SplitReveal>
        {text.intro && (
          <Fade as="p" className="testimonials__intro center">
            {text.intro}
          </Fade>
        )}
      </div>
      <div
        className="testimonials__viewport"
        onPointerDown={(e) => {
          drag.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (drag.current === null) return;
          const dx = e.clientX - drag.current;
          drag.current = null;
          if (dx < -50) setIndex((i) => Math.min(max, i + 1));
          else if (dx > 50) setIndex((i) => Math.max(0, i - 1));
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <div ref={track} className="testimonials__track">
          {testimonials.map((t, i) => (
            <article
              className="t-card"
              key={i}
              aria-hidden={i !== index}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${testimonials.length}`}
              onClick={() => i !== index && setIndex(i)}
            >
              <div className="t-card__media">
                <Photo {...image(cardImages[i % cardImages.length])} />
                <span className="t-card__chip">{t.topic}</span>
              </div>
              <p className="t-card__logo">Client logo</p>
              <blockquote className="t-card__quote">{t.quote}</blockquote>
              <footer className="t-card__foot">
                <span>
                  <strong>{t.name}</strong>
                  <br />
                  {t.role}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
      <div className="testimonials__controls">
        <button type="button" className="sq-btn" aria-label="Previous testimonial" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          <ArrowIcon direction="left" />
        </button>
        <button type="button" className="sq-btn" aria-label="Next testimonial" disabled={index === max} onClick={() => setIndex((i) => Math.min(max, i + 1))}>
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}
