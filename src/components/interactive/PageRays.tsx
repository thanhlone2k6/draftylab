'use client';
// Ambient Side Rays behind the page: hidden over the hero (its background stays untouched) and faded in
// once the visitor scrolls past it. The WebGL canvas is only mounted after that, so the hero costs nothing.
import { useEffect, useRef, useState } from 'react';
import SideRays from '../react-bits/SideRays';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function PageRays() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hero = document.getElementById('top');
    let raf = 0;

    const update = () => {
      raf = 0;
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      const start = heroHeight * 0.5;
      const end = Math.max(start + 1, heroHeight);
      const k = clamp01((window.scrollY - start) / (end - start));
      el.style.opacity = String(k);
      if (k > 0) setActive(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="page-rays" aria-hidden="true" style={{ opacity: 0 }}>
      {active && (
        // React Bits "Sunbeam" preset — FROZEN (speed 0, no mouse follow) so the page background is a still
        // light instead of an animating shader (the continuous WebGL repaint was causing jank).
        <SideRays
          rayColor1="#ffc46b"
          rayColor2="#96c8ff"
          blend={0.58}
          origin="top-right"
          speed={0}
          intensity={2}
          spread={2}
          density={5}
          sharpness={0.5}
          tilt={0}
          falloff={1.6}
          glow={1}
          saturation={1}
          dust={0}
          followMouse={false}
          intro={false}
          lightMode={false}
          opacity={0.54}
        />
      )}
    </div>
  );
}
