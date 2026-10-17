// One brand group in the Social Production rail.
// 2026-10-18 (owner): the section is IMAGES ONLY — every Social Production video was moved out of the
// scanned tree (see scripts/lib/config.mjs). The Depth Carousel is replaced by a React Bits
// **TiltedCard** that tilts/glows under the cursor and gently floats, cycling through ALL of the
// brand's images (click the card to jump to the next one). The rail itself still drifts right→left.
import { useEffect, useRef, useState } from 'react';
import TiltedCard from '../react-bits/TiltedCard';
import { type Brand, type MediaItem } from '../../lib/media';

/** Dwell per image. */
const STEP_MS = 1800;

export interface BrandCardProps {
  brand: Brand;
  items: MediaItem[];
  mounted: boolean;
  reducedMotion: boolean;
  onFirstInteraction: () => void;
  /** visual position in the looping rail (CSS order) and stagger index for the entry fade */
  order: number;
  introIndex: number;
}

export default function SocialBrandCard({ brand, items, mounted, reducedMotion, onFirstInteraction, order, introIndex }: BrandCardProps) {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.7] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance through the brand's images; paused while the pointer/focus is on the group.
  useEffect(() => {
    if (!mounted || !inView || engaged || reducedMotion || items.length < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [index, mounted, inView, engaged, reducedMotion, items.length]);

  const current = items[index] ?? items[0];

  const next = () => {
    onFirstInteraction();
    if (items.length > 1) setIndex((i) => (i + 1) % items.length);
  };

  return (
    <article
      ref={root}
      className="sb"
      aria-labelledby={`sb-${brand.id}`}
      data-brand={brand.id}
      style={{ order, ['--i' as string]: introIndex }}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false);
      }}
    >
      <div className="sb__stage">
        {mounted && current ? (
          <TiltedCard
            className="sb__tilt"
            imageSrc={current.posterSrc}
            altText={current.alt}
            captionText={current.title}
            containerWidth="100%"
            containerHeight="100%"
            imageWidth="var(--sb-card-w)"
            imageHeight="var(--sb-card-h)"
            rotateAmplitude={12}
            scaleOnHover={1.2}
            perspective={750}
            smoothness={0.75}
            glare={0.2}
            shadow={0.65}
            parallax={0.3}
            radius={18}
            reverse
            floating
            intro
            introDelay={Math.max(0, introIndex) * 90}
            onClick={next}
          />
        ) : (
          // Lightweight placeholder until the brand scrolls near the rail viewport (same box, no layout shift).
          <div className="sb__placeholder" aria-hidden="true">
            {items[0] && <img src={items[0].posterSrc} alt="" loading="lazy" decoding="async" width={310} height={388} />}
          </div>
        )}
      </div>

      <h3 id={`sb-${brand.id}`} className="sb__name">{brand.displayName}</h3>

      <p className="sr-only sb__counter" aria-live="polite" aria-atomic="true">
        {brand.displayName}: {index + 1} / {items.length}
      </p>
    </article>
  );
}
