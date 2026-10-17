'use client';
// React Bits — Depth Carousel (source: https://reactbits.dev/r/DepthCarousel-TS-CSS.json, fetched 2026-10-17).
// DFL2: local modifications are marked with `// DFL2:` comments. Summary (see docs/social-gesture-notes.md):
//   1. Wheel only handled when the gesture is horizontal-dominant — vertical wheel scrolls the page.
//   2. Pointer drag uses an axis lock: vertical intent releases the gesture to the page; horizontal intent
//      captures it and stops propagation so the outer brand rail never moves at the same time.
//   3. Click after a drag is suppressed (the original checked dragRef after it was already cleared).
//   4. `onActivate` fires when the ACTIVE card is tapped/clicked (or Enter pressed) → opens a lightbox.
//      Tapping a neighbouring card still just brings it to the front (original behaviour).
//   5. Items may carry a `kind` + custom overlay (play badge / "not ready" state); images are lazy.
//   6. Imperative `apiRef` (prev/next/goTo) so the parent renders labelled controls + counter.
//   7. Default demo images removed (no stock imagery in production).
//   8. CSS: stage is pointer-events:none so cards behind the front card are clickable (DepthCarousel.css).
//  11. Arrow buttons take `prevLabel` / `nextLabel` (localised, per brand).
//  10. Scale-to-fit padding reduced (120 → 40) so the carousel can be larger inside a column.
//   9. Initial card transforms are rendered server-side (computeCard) — no stacked flash before hydration.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type ReactNode
} from 'react';
import gsap from 'gsap';
import './DepthCarousel.css';

// DFL2: `id` + `kind` let the parent map a slide to the global lightboxes.
export type DepthCarouselSlide = { image: string; alt?: string; id?: string; kind?: 'image' | 'video' | 'video-pending'; /** how the media fills the card; 'contain' shows 9:16 in full with transparent sides */ fit?: 'cover' | 'contain' };
export type DepthCarouselItem = string | DepthCarouselSlide;
export interface DepthCarouselApi {
  prev: () => void;
  next: () => void;
  goTo: (index: number) => void;
}
type TiltDirection = 'left' | 'right';

export interface DepthCarouselProps {
  items?: DepthCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: TiltDirection;
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: DepthCarouselSlide) => void;
  className?: string;
  // DFL2 additions
  onActivate?: (index: number, item: DepthCarouselSlide) => void;
  renderOverlay?: (item: DepthCarouselSlide, index: number, isActive: boolean) => ReactNode;
  apiRef?: RefObject<DepthCarouselApi | null>;
  ariaLabel?: string;
  slideLabel?: (index: number, count: number, item: DepthCarouselSlide) => string;
  prevLabel?: string;
  nextLabel?: string;
}

interface CarouselConfig {
  count: number;
  depth: number;
  spread: number;
  tilt: number;
  tiltDirection: TiltDirection;
  visibleCards: number;
  falloff: number;
  blur: number;
  duration: number;
  ease: string;
  loop: boolean;
  cardWidth: number;
  autoplayDelay: number;
}

interface DragState {
  x: number;
  startPos: number;
  lastX: number;
  lastT: number;
  v: number;
  moved: boolean;
  id: number;
  // DFL2: axis lock
  y: number;
}

// DFL2: demo picsum images removed — callers must pass real items.
const DEFAULT_ITEMS: DepthCarouselItem[] = [];
// DFL2: drag threshold (px) before a gesture is classified as horizontal/vertical.
const AXIS_LOCK_PX = 8;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
// DFL2: per-card math extracted from the original `layout()` (unchanged) so the
// server-rendered HTML already shows the stacked depth layout before hydration.
const computeCard = (i: number, pos: number, cfg: CarouselConfig, sc: number) => {
  const n = cfg.count;
  const dir = cfg.tiltDirection === 'left' ? -1 : 1;
  let d = i - pos;
  if (cfg.loop && n > 1) {
    d = ((d % n) + n) % n;
    if (d > n / 2) d -= n;
  }
  const back = Math.max(0, d);
  const az = Math.abs(d);
  const shown = az <= cfg.visibleCards + 0.5;
  const tz = -cfg.depth * d;
  const tx = dir * cfg.spread * d;
  const ry = dir * cfg.tilt * clamp(d, 0, 1);
  let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
  if (!shown) opacity = 0;
  const brightness = Math.max(0.15, 1 - back * cfg.falloff);
  const blurPx = cfg.blur > 0 ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur) : 0;
  const zi = Math.round(2000 - d * 20);
  return {
    transform: `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`,
    opacity: opacity.toFixed(3),
    filter: `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`,
    zIndex: String(zi),
    pointerEvents: shown && opacity > 0.05 ? 'auto' : 'none',
    tintOpacity: clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3)
  };
};

const normalizeItem = (it: DepthCarouselItem): DepthCarouselSlide => (typeof it === 'string' ? { image: it, alt: '' } : it);

const DepthCarousel = ({
  items = DEFAULT_ITEMS,
  cardWidth = 300,
  cardHeight = 380,
  radius = 18,
  tint = '#05060a',
  depth = 220,
  spread = 90,
  tilt = 22,
  tiltDirection = 'right',
  perspective = 1400,
  visibleCards = 4,
  falloff = 0.2,
  blur = 6,
  duration = 700,
  ease = 'power3.out',
  autoplay = false,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  showIndicators = true,
  onChange,
  className = '',
  onActivate,
  renderOverlay,
  apiRef,
  ariaLabel = 'Depth carousel',
  slideLabel,
  prevLabel = 'Previous slide',
  nextLabel = 'Next slide'
}: DepthCarouselProps) => {
  const data = useMemo(() => (Array.isArray(items) ? items : []).map(normalizeItem), [items]);
  const count = data.length;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const cfgRef = useRef<CarouselConfig>({} as CarouselConfig);
  const onChangeRef = useRef(onChange);
  const onActivateRef = useRef(onActivate);
  // DFL2: set on pointerup after a real drag; swallows the click the browser fires next.
  const suppressClickRef = useRef(false);

  const dragRef = useRef<DragState | null>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedRef = useRef(false);

  const [active, setActive] = useState(0);

  onChangeRef.current = onChange;
  onActivateRef.current = onActivate;
  cfgRef.current = {
    count,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    duration,
    ease,
    loop,
    cardWidth,
    autoplayDelay
  };

  const layout = useCallback((pos: number) => {
    const cfg = cfgRef.current;
    const n = cfg.count;
    if (!n) return;
    const sc = scaleRef.current;

    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const st = computeCard(i, pos, cfg, sc);
      el.style.transform = st.transform;
      el.style.opacity = st.opacity;
      el.style.filter = st.filter;
      el.style.zIndex = st.zIndex;
      el.style.pointerEvents = st.pointerEvents;
      const ov = overlayRefs.current[i];
      if (ov) ov.style.opacity = st.tintOpacity;
    }
  }, []);


  const notify = useCallback(
    (idx: number) => {
      setActive(idx);
      onChangeRef.current?.(idx, data[idx]);
    },
    [data]
  );

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const cfg = cfgRef.current;
      const proxy = { p: posRef.current };
      const dur = animate && !reducedRef.current ? cfg.duration / 1000 : 0;
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: dur,
        ease: cfg.ease,
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        onComplete: () => {
          const n = cfg.count;
          if (n > 0) posRef.current = ((posRef.current % n) + n) % n;
          layout(posRef.current);
        }
      });
    },
    [layout]
  );

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      const cfg = cfgRef.current;
      const n = cfg.count;
      if (!n) return;
      const idx = cfg.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);
      let delta = idx - posRef.current;
      if (cfg.loop && n > 1) {
        delta = ((delta % n) + n) % n;
        if (delta > n / 2) delta -= n;
      }
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        notify(idx);
      }
    },
    [tweenTo, notify]
  );

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step, true), [setFocus]);

  // DFL2: imperative API for parent-rendered, labelled controls.
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = { prev: () => navigateBy(-1), next: () => navigateBy(1), goTo: (i: number) => setFocus(i, true) };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, navigateBy, setFocus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const cfg = cfgRef.current;
      const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 40; // DFL2: was +120 — lets the cards use more of the column
      scaleRef.current = clamp(w / needed, 0.4, 1);
      layout(posRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [layout]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const cfg = cfgRef.current;
      if (cfg.count < 2) return;
      // DFL2: only take horizontal-dominant wheel/trackpad gestures. Vertical wheel must scroll the page.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation(); // DFL2: the outer brand rail must not scroll from the same gesture.
      tweenRef.current?.kill();
      const raw = e.deltaX;
      const delta = e.deltaMode === 1 ? raw * 24 : raw;
      const step = clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6);
      posRef.current += step;
      layout(posRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => setFocus(Math.round(posRef.current), true), 130);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [layout, setFocus]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const cfg = cfgRef.current;
    suppressClickRef.current = false;
    // DFL2: inner gestures belong to the carousel only.
    e.stopPropagation();
    if (cfg.count < 2) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId
    };
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const cfg = cfgRef.current;
      const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved) {
        // DFL2: axis lock. Vertical intent → hand the gesture back to the page (scroll).
        if (Math.abs(dy) > AXIS_LOCK_PX && Math.abs(dy) > Math.abs(dx)) {
          dragRef.current = null;
          return;
        }
        if (Math.abs(dx) <= AXIS_LOCK_PX) return;
        drag.moved = true;
        tweenRef.current?.kill();
        try {
          rootRef.current?.setPointerCapture(drag.id);
        } catch {
          /* pointer already released */
        }
      }
      e.stopPropagation();
      const now = performance.now();
      const dt = Math.max(now - drag.lastT, 1);
      drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = now;
      posRef.current = drag.startPos - dx / stepPx;
      layout(posRef.current);
    },
    [layout]
  );

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    suppressClickRef.current = true; // DFL2: the click that follows a drag must not select/open.
    const cfg = cfgRef.current;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
    const projected = posRef.current - (drag.v * 180) / stepPx;
    setFocus(Math.round(projected), true);
  }, [setFocus]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateBy(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateBy(1);
      } else if ((e.key === 'Enter' || e.key === ' ') && e.target === rootRef.current) {
        // DFL2: Enter/Space on the focused carousel opens the active slide.
        e.preventDefault();
        const idx = focusRef.current;
        if (data[idx]) onActivateRef.current?.(idx, data[idx]);
      }
    },
    [navigateBy, data]
  );

  const onCardClick = useCallback(
    (index: number) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      // DFL2: tap on the front card opens it; tap on a neighbour brings it forward.
      if (index === focusRef.current) {
        if (data[index]) onActivateRef.current?.(index, data[index]);
        return;
      }
      setFocus(index, true);
    },
    [setFocus, data]
  );

  useEffect(() => {
    reducedRef.current = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!autoplay || reducedRef.current || count < 2) return;
    const root = rootRef.current;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    const start = () => {
      stop();
      autoTimerRef.current = setInterval(
        () => {
          if (!hovered && !focused) navigateBy(1);
        },
        Math.max(cfgRef.current.autoplayDelay, 600)
      );
    };
    const onEnter = () => {
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    root?.addEventListener('mouseenter', onEnter);
    root?.addEventListener('mouseleave', onLeave);
    root?.addEventListener('focusin', onFocusIn);
    root?.addEventListener('focusout', onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener('mouseenter', onEnter);
      root?.removeEventListener('mouseleave', onLeave);
      root?.removeEventListener('focusin', onFocusIn);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(posRef.current);
  }, [layout, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, cardWidth, cardHeight, radius, count]);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className={`depth-carousel ${className}`.trim()}
      style={{ '--dc-perspective': `${perspective}px` } as CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      data-inner-gesture=""
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="depth-carousel__stage" ref={stageRef}>
        {data.map((item, i) => (
          <div
            key={i}
            className="depth-carousel__card"
            ref={el => {
              cardRefs.current[i] = el;
            }}
            style={(() => {
              // DFL2: initial (pre-hydration) depth layout; layout() takes over imperatively afterwards.
              const st = computeCard(i, 0, cfgRef.current, 1);
              return {
                width: cardWidth,
                height: cardHeight,
                borderRadius: radius,
                transform: st.transform,
                opacity: Number(st.opacity),
                filter: st.filter,
                zIndex: Number(st.zIndex)
              } as CSSProperties;
            })()}
            data-active={active === i ? '' : undefined}
            data-kind={item.kind}
            data-fit={item.fit}
            aria-roledescription="slide"
            aria-label={slideLabel ? slideLabel(i, count, item) : `${i + 1} of ${count}`}
            aria-hidden={active !== i}
            onClick={() => onCardClick(i)}
          >
            {/* DFL2: lazy + async decode; only near cards are visible anyway. */}
            <img
              className="depth-carousel__img"
              src={item.image}
              alt={item.alt || ''}
              draggable={false}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />
            {renderOverlay?.(item, i, active === i)}
            <span
              className="depth-carousel__tint"
              ref={el => {
                overlayRefs.current[i] = el;
              }}
              style={{ background: tint }}
            />
          </div>
        ))}
      </div>

      {showControls && count > 1 && (
        <>
          <button
            type="button"
            className="depth-carousel__arrow depth-carousel__arrow--prev"
            aria-label={prevLabel}
            onClick={() => navigateBy(-1)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="depth-carousel__arrow depth-carousel__arrow--next"
            aria-label={nextLabel}
            onClick={() => navigateBy(1)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {showIndicators && count > 1 && (
        <div className="depth-carousel__dots" role="tablist" aria-label="Slides">
          {data.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to slide ${i + 1}`}
              className={`depth-carousel__dot${active === i ? ' is-active' : ''}`}
              onClick={() => setFocus(i, true)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DepthCarousel;
