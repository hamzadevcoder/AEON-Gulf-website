import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Motion tokens measured from the reference and the modern-animation kit. */
export const EASE_OUT = 'expo.out';
export const EASE_INOUT = 'expo.inOut';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Resolve once web fonts are loaded, so text is split on its final line breaks. */
export const fontsReady = () =>
  typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve();
