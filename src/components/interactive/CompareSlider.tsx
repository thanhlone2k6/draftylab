// Before/after compare slider: both images share ONE frame; the handle reveals the "after" image
// (clip-path) over the "before". Mouse: follows the cursor (hover). Touch: drag with axis lock. Keyboard: role=slider.
// Vertical page scrolling still works on touch: `touch-action: pan-y` and horizontal intent only.
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  before: { src: string; alt: string; label: string };
  after: { src: string; alt: string; label: string };
  width: number;
  height: number;
  ariaLabel: string;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

export default function CompareSlider({ before, after, width, height, ariaLabel }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // % of the frame shown as "before"
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const drag = useRef<{ id: number; startX: number; startY: number; locked: boolean } | null>(null);

  const fromClient = useCallback((clientX: number) => {
    const r = frame.current!.getBoundingClientRect();
    setPos(clamp(((clientX - r.left) / r.width) * 100));
  }, []);

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, locked: e.pointerType === 'mouse' };
    if (e.pointerType === 'mouse') {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      setTouched(true);
      fromClient(e.clientX);
    }
  };
  const onMove = (e: React.PointerEvent) => {
    // Mouse: the handle simply follows the cursor — no click or drag needed.
    if (e.pointerType === 'mouse') {
      fromClient(e.clientX);
      if (!touchedRef.current) setTouched(true);
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.locked) {
      // touch: decide the axis first so vertical swipes keep scrolling the page
      const dx = Math.abs(e.clientX - d.startX);
      const dy = Math.abs(e.clientY - d.startY);
      if (dx < 6 && dy < 6) return;
      if (dy > dx) {
        drag.current = null;
        return;
      }
      d.locked = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      setTouched(true);
    }
    fromClient(e.clientX);
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) {
      // a plain tap (no drag) on touch jumps the handle to the tap point
      if (!drag.current.locked) fromClient(e.clientX);
      drag.current = null;
      setDragging(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setPos((p) => clamp(p - step));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setPos((p) => clamp(p + step));
    else if (e.key === 'Home') setPos(0);
    else if (e.key === 'End') setPos(100);
    else return;
    setTouched(true);
    e.preventDefault();
  };

  // Nudge once when first scrolled into view so the control is discoverable (skipped with reduced motion).
  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let done = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done) return;
        done = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / 1400);
          setPos((p) => (touchedRef.current ? p : 50 + Math.sin(k * Math.PI * 2) * 14 * (1 - k)));
          if (k < 1 && !touchedRef.current) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const touchedRef = useRef(false);
  touchedRef.current = touched;

  return (
    <div className="cmp">
      <div
        ref={frame}
        className="cmp__frame"
        data-dragging={dragging ? '' : undefined}
        style={{ aspectRatio: `${width} / ${height}`, ['--cmp-pos' as string]: `${pos}%` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img className="cmp__img cmp__img--after" src={after.src} alt={after.alt} draggable={false} loading="lazy" decoding="async" />
        <img className="cmp__img cmp__img--before" src={before.src} alt={before.alt} draggable={false} loading="lazy" decoding="async" />
        <div
          className="cmp__handle"
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% ${before.label}, ${100 - Math.round(pos)}% ${after.label}`}
          onKeyDown={onKey}
        >
          <span className="cmp__grip" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}
