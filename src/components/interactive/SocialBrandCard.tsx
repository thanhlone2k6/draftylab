// One brand group in the Social Production rail, with its OWN React Bits Depth Carousel.
// Items are viewed IN PLACE (no lightbox): images just show; the front slide's video plays automatically at 50%
// volume while the pointer is on the group (muted otherwise); a tap/click on the front slide pauses/resumes it.
// Chrome is minimal: the brand name sits below the carousel, and arrows only appear on hover.
// The carousel auto-advances (0.7s per image, 2s per video) and pauses while the pointer/focus is on the group.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DepthCarousel, { type DepthCarouselSlide, type DepthCarouselApi } from '../react-bits/DepthCarousel';
import SocialSlideVideo from './SocialSlideVideo';
import { type Brand, type MediaItem, isPlayable } from '../../lib/media';
import { social as t } from '../../data/content';

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
  const api = useRef<DepthCarouselApi | null>(null);
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const slides = useMemo<DepthCarouselSlide[]>(
    () =>
      items.map((m) => ({
        id: m.id,
        image: m.posterSrc,
        alt: m.alt,
        kind: m.type === 'image' ? 'image' : 'video',
        // 9:16 videos show in full (contain); everything else fills the card.
        fit: m.type === 'video' && m.aspectRatio < 0.62 ? 'contain' : 'cover',
      })),
    [items],
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio > 0.35), { threshold: [0, 0.35, 0.7] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance: 0.7s per image, 2s per video; paused while the pointer/focus is on the group.
  useEffect(() => {
    if (!mounted || !inView || engaged || reducedMotion || items.length < 2) return;
    const delay = items[index]?.type === 'video' ? 2000 : 700;
    const timer = window.setTimeout(() => api.current?.next(), delay);
    return () => window.clearTimeout(timer);
  }, [index, mounted, inView, engaged, reducedMotion, items]);

  // Tap / click on the front slide: pause / resume its video (images: nothing — no zoom).
  const activate = useCallback(
    (i: number) => {
      onFirstInteraction();
      if (items[i]?.type === 'video') setUserPaused((p) => !p);
    },
    [items, onFirstInteraction],
  );

  const renderOverlay = useCallback(
    (_slide: DepthCarouselSlide, i: number, isActive: boolean) => {
      const m = items[i];
      if (!m || m.type !== 'video' || !isActive || !isPlayable(m)) return null;
      return (
        <SocialSlideVideo
          src={m.videoSrc!}
          playing={inView && !userPaused}
          engaged={engaged}
          landscape={m.aspectRatio > 1}
          contain={m.aspectRatio < 0.62}
        />
      );
    },
    [items, inView, userPaused, engaged],
  );

  const current = items[index];

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
        {mounted ? (
          <DepthCarousel
            items={slides}
            apiRef={api}
            cardWidth={380}
            cardHeight={475}
            radius={18}
            depth={reducedMotion ? 90 : 170}
            spread={46}
            tilt={reducedMotion ? 0 : 14}
            perspective={1400}
            visibleCards={3}
            falloff={0.22}
            blur={reducedMotion ? 0 : 3}
            duration={reducedMotion ? 0 : 600}
            loop
            autoplay={false}
            showControls
            showIndicators={false}
            prevLabel={t.postPrev(brand.displayName)}
            nextLabel={t.postNext(brand.displayName)}
            onChange={(i) => {
              setIndex(i);
              setUserPaused(false);
              onFirstInteraction();
            }}
            onActivate={activate}
            renderOverlay={renderOverlay}
            ariaLabel={`Bài đăng của ${brand.displayName}`}
            slideLabel={(i, n, s) => `${s.alt ?? ''} — ${i + 1} / ${n}`}
            className="sb__carousel"
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
        {current ? `, ${current.type === 'video' ? 'video' : 'ảnh'}` : ''}
      </p>
    </article>
  );
}
