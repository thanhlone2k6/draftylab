// Selective GSAP enhancement layer.
// Progressive: the CSS-only reveal-on-scroll and hover states work without it,
// and everything here is skipped when the visitor prefers reduced motion.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) approachLine();

function approachLine() {
  const steps = document.querySelector<HTMLElement>('[data-steps]');
  if (!steps) return;
  const nodes = steps.querySelectorAll<HTMLElement>('.step');

  if (window.matchMedia('(min-width: 800px)').matches) {
    // Desktop: fade the four columns in sequence.
    gsap.from(nodes, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: { trigger: steps, start: 'top 80%' },
      clearProps: 'all',
    });
  } else {
    // Mobile: the gold underline of each step draws across as it enters.
    nodes.forEach((node) => {
      gsap.fromTo(
        node,
        { '--draw': 0 },
        {
          '--draw': 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: node, start: 'top 85%' },
        }
      );
    });
  }
}
