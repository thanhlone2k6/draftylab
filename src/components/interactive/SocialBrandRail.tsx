// Social Production — ONE horizontal rail of brand groups, drifting slowly right→left and looping forever.
// (Minimal chrome: only two rail arrows, shown on hover-capable devices; swipe works on touch.)
//  • Custom CSS/JS (not React Bits). Native overflow scrolling is kept so touch swipes and trackpads work.
//  • Infinite loop WITHOUT cloning: brands are reordered with CSS `order`; when a card has fully left the view
//    its `order` wraps to the end and scrollLeft is compensated in the same frame (no jump, state preserved).
//  • Drift pauses on hover / focus / drag / touch / dialog open / off-screen / hidden tab; it is off under
//    reduced motion and on touch-only devices (no hover to pause with). Arrows always work (and wrap).
//  • Entry: cards fade in (opacity + 16px + blur) with a stagger the first time the rail is scrolled into view.
//  • Inner gestures (drag on a brand's images) stay with that brand's Depth Carousel: [data-inner-gesture].
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import SocialBrandCard from './SocialBrandCard';
import { brands, brandMedia } from '../../lib/media';
import { social as t } from '../../data/content';
import { IconNext, IconPrev } from '../media/icons';

const DRAG_THRESHOLD = 8;
const DRIFT_PX_PER_S = 65; // was 26 — the rail now drifts 2.5× faster
const DRIFT_HOVER_PX_PER_S = 20.8; // 0.8× the old 26 — keeps drifting (slower) while hovered
const BUFFER = 2; // cards kept off-screen on the left

const ease = (k: number) => 1 - Math.pow(1 - k, 3);

export default function SocialBrandRail() {
  const n = brands.length;
  const railRef = useRef<HTMLDivElement>(null);
  // Visual position of brand i = (i - offset) mod n. Server HTML uses the natural order (offset 0); on hydration
  // (before paint) the rail is rotated so BUFFER cards sit off-screen on the left.
  const [offset, setOffset] = useState(0);
  const initDone = useRef(false);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const [mounted, setMounted] = useState<Set<string>>(() => new Set(brands.map((b) => b.id).slice(0, 5)));
  const [reduced, setReduced] = useState(false);
  const [intro, setIntro] = useState<'ssr' | 'pre' | 'in'>('ssr');

  const hold = useRef({ hover: false, focus: false, drag: false, touch: false, visible: true, hidden: false, arrows: false });
  const fx = useRef(0); // float scroll position (scrollLeft is integer in most browsers)
  const lastSet = useRef(0);
  const anim = useRef<{ from: number; to: number; t0: number; dur: number } | null>(null);
  const dragRef = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const dismissHint = useCallback(() => {}, []); // (hint pill removed — kept as a stable callback for the cards)

  const measureStep = useCallback(() => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('.sb');
    if (!rail || !card) return 0;
    const gap = parseFloat(getComputedStyle(rail).columnGap || '0') || 0;
    stepRef.current = card.offsetWidth + gap;
    return stepRef.current;
  }, []);

  useLayoutEffect(() => {
    setOffset(n - BUFFER);
  }, [n]);
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail || initDone.current || offset !== n - BUFFER) return;
    initDone.current = true;
    const s = measureStep();
    rail.scrollLeft = s * BUFFER;
    fx.current = lastSet.current = rail.scrollLeft;
    // The first time, hide the cards only if the rail is still below the fold, then reveal on scroll-in.
    const top = rail.getBoundingClientRect().top;
    setIntro(top > window.innerHeight * 0.85 ? 'pre' : 'in');
  }, [offset, n, measureStep]);

  // Keep the buffer invariant: scrollLeft ∈ [1·step, (BUFFER+1)·step).
  const normalize = useCallback(() => {
    const rail = railRef.current;
    const s = stepRef.current;
    if (!rail || !s) return;
    let guard = 0;
    while (guard++ < n) {
      const left = rail.scrollLeft;
      let delta = 0;
      if (left >= (BUFFER + 1) * s) delta = -s;
      else if (left < s) delta = s;
      else break;
      flushSync(() => setOffset((o) => (o + (delta < 0 ? 1 : -1) + n) % n));
      rail.scrollLeft = left + delta;
      // keep every in-flight motion consistent with the shifted origin
      fx.current += delta;
      lastSet.current = rail.scrollLeft;
      if (anim.current) {
        anim.current.from += delta;
        anim.current.to += delta;
      }
      if (dragRef.current) dragRef.current.left += delta;
    }
  }, [n]);

  // Reveal + pause bookkeeping.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const io = new IntersectionObserver(
      ([e]) => {
        hold.current.visible = e.isIntersecting;
        if (e.isIntersecting) setIntro((cur) => (cur === 'pre' ? 'in' : cur));
      },
      { threshold: 0.12 },
    );
    io.observe(rail);
    // Lazy-mount carousels near the viewport of the rail.
    const mountIo = new IntersectionObserver(
      (entries) => {
        const ids = entries.filter((e) => e.isIntersecting).map((e) => (e.target as HTMLElement).dataset.brand!);
        if (ids.length) setMounted((cur) => (ids.every((id) => cur.has(id)) ? cur : new Set([...cur, ...ids])));
      },
      { root: rail, rootMargin: '0px 70% 0px 70%' },
    );
    rail.querySelectorAll('.sb').forEach((el) => mountIo.observe(el));
    const onVis = () => (hold.current.hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => {
      const before = stepRef.current;
      const s = measureStep();
      if (before && s && Math.abs(s - before) > 0.5) {
        rail.scrollLeft = (rail.scrollLeft / before) * s;
        fx.current = lastSet.current = rail.scrollLeft;
      }
    });
    ro.observe(rail);
    return () => {
      io.disconnect();
      mountIo.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [measureStep]);

  // Main loop: drift + arrow animation + loop normalisation.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(200, now - last); // cap so a stalled tab never makes the rail leap
      last = now;
      const h = hold.current;
      // someone else moved it (drag, touch, wheel, keyboard focus): adopt their position
      if (Math.abs(rail.scrollLeft - lastSet.current) > 1.5) fx.current = rail.scrollLeft;
      const dialogOpen = !!window.__dfl?.isOpen?.();
      if (anim.current) {
        const a = anim.current;
        const k = Math.min(1, (now - a.t0) / a.dur);
        fx.current = a.from + (a.to - a.from) * ease(k);
        if (k >= 1) anim.current = null;
      } else if (canHover && !reduced && !h.focus && !h.drag && !h.touch && h.visible && !h.hidden && !dialogOpen) {
        // Hover no longer pauses the rail — it just slows it down.
        fx.current += ((h.hover ? DRIFT_HOVER_PX_PER_S : DRIFT_PX_PER_S) * dt) / 1000;
      } else {
        return;
      }
      const target = Math.round(fx.current);
      if (target !== Math.round(rail.scrollLeft)) {
        rail.scrollLeft = target;
        lastSet.current = rail.scrollLeft;
      }
      if (!h.touch) normalize();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced, normalize]);

  // Native scrolling (touch / trackpad / keyboard): normalise once it settles.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!hold.current.touch && !anim.current) normalize();
      }, 90);
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      rail.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [normalize]);

  const go = (dir: number) => {
    dismissHint();
    const s = measureStep();
    const rail = railRef.current;
    if (!rail || !s) return;
    const from = anim.current ? anim.current.to : rail.scrollLeft;
    fx.current = rail.scrollLeft;
    anim.current = { from: rail.scrollLeft, to: from + dir * s, t0: performance.now(), dur: reduced ? 1 : 520 };
  };

  // Mouse drag on header / gaps; touch keeps native scrolling (we only flag it to pause + defer looping).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let suppress = false;
    let touchTimer = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        hold.current.touch = true;
        window.clearTimeout(touchTimer);
        return;
      }
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-inner-gesture], button, a, input')) return;
      anim.current = null;
      dragRef.current = { x: e.clientX, left: rail.scrollLeft, moved: false };
      suppress = false;
    };
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!d.moved) {
        d.moved = true;
        hold.current.drag = true;
        rail.classList.add('is-dragging');
        dismissHint();
      }
      rail.scrollLeft = d.left - dx;
      lastSet.current = rail.scrollLeft;
      fx.current = rail.scrollLeft;
      normalize();
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touchTimer = window.setTimeout(() => {
          hold.current.touch = false;
          normalize();
        }, 350);
        return;
      }
      const d = dragRef.current;
      dragRef.current = null;
      if (!d?.moved) return;
      suppress = true;
      hold.current.drag = false;
      rail.classList.remove('is-dragging');
    };
    const click = (e: MouseEvent) => {
      if (suppress) {
        e.preventDefault();
        e.stopPropagation();
        suppress = false;
      }
    };
    const enter = () => (hold.current.hover = true);
    const leave = () => (hold.current.hover = false);
    const fin = () => (hold.current.focus = true);
    const fout = (e: FocusEvent) => {
      if (!rail.contains(e.relatedTarget as Node | null)) hold.current.focus = false;
    };
    rail.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    rail.addEventListener('click', click, true);
    rail.addEventListener('pointerenter', enter);
    rail.addEventListener('pointerleave', leave);
    rail.addEventListener('focusin', fin);
    rail.addEventListener('focusout', fout);
    return () => {
      window.clearTimeout(touchTimer);
      rail.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      rail.removeEventListener('click', click, true);
      rail.removeEventListener('pointerenter', enter);
      rail.removeEventListener('pointerleave', leave);
      rail.removeEventListener('focusin', fin);
      rail.removeEventListener('focusout', fout);
    };
  }, [dismissHint, normalize]);

  return (
    <div className="srail" data-intro={intro}>
      <div className="srail__bar">
        <div className="srail__arrows">
          <button type="button" className="icon-btn icon-btn--lg" onClick={() => go(-1)} aria-label={t.railPrev}>
            <IconPrev />
          </button>
          <button type="button" className="icon-btn icon-btn--lg" onClick={() => go(1)} aria-label={t.railNext}>
            <IconNext />
          </button>
        </div>
      </div>

      <div ref={railRef} className="srail__track" role="region" aria-label="Các thương hiệu Social Production" tabIndex={0}>
        {brands.map((b, i) => {
          const pos = (((i - offset) % n) + n) % n;
          return (
            <SocialBrandCard
              key={b.id}
              brand={b}
              items={brandMedia(b)}
              mounted={mounted.has(b.id)}
              reducedMotion={reduced}
              onFirstInteraction={dismissHint}
              order={pos}
              introIndex={Math.max(0, pos - BUFFER)}
            />
          );
        })}
      </div>
    </div>
  );
}
