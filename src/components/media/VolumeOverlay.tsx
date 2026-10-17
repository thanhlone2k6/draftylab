// In-place volume gauge (touch devices) — see docs/decisions-log.md, 17/10.
// The shared preview controller (VideoPosterCard.astro) dispatches `dfl:volume` when a *running* preview is
// tapped again; this island portals the React Bits SloshGauge over that card's media box, blurs what sits
// behind it (backdrop-filter) and writes the level to the session store, so every video below follows it.
// Escape or a tap outside closes it and dispatches `dfl:volume-close`, so the controller can unblur/clean up.
// It mounts into the card's wrapper (a sibling of the card <button>), never inside the button itself.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import SloshGauge from '../react-bits/SloshGauge';
import { IconPause, IconPlay } from './icons';
import { setVolume, useVolume } from '../../lib/volume';
import { dialog, volume as t } from '../../data/content';

interface Target {
  /** The card wrapper the overlay mounts into (position: relative). */
  wrap: HTMLElement;
  /** The `.vcard__media` box the gauge covers and measures itself against. */
  media: HTMLElement;
  video: HTMLVideoElement | null;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const measure = (media: HTMLElement) => {
  const box = media.getBoundingClientRect();
  return {
    w: Math.round(clamp(box.width * 0.6, 56, 88)),
    h: Math.round(clamp(box.height * 0.6, 120, 190)),
    boxH: Math.round(box.height),
  };
};

export default function VolumeOverlay() {
  const [target, setTarget] = useState<Target | null>(null);
  const [size, setSize] = useState({ w: 88, h: 180, boxH: 0 });
  const [playing, setPlaying] = useState(true);
  const level = useVolume();

  const close = useCallback(() => {
    setTarget(null);
    window.dispatchEvent(new Event('dfl:volume-close'));
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<Target | undefined>).detail;
      if (!d || !d.wrap || !d.media) return;
      setSize(measure(d.media));
      setPlaying(d.video ? !d.video.paused : true);
      setTarget(d);
    };
    window.addEventListener('dfl:volume', onOpen as EventListener);
    return () => window.removeEventListener('dfl:volume', onOpen as EventListener);
  }, []);

  // Keep the gauge sized to the media box (rotation, resize, iOS toolbar collapse).
  useEffect(() => {
    if (!target) return;
    const onResize = () => setSize(measure(target.media));
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [target]);

  // Escape closes the gauge (no dialog is open while an in-place preview runs).
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [target, close]);

  if (!target || typeof document === 'undefined') return null;

  const toggle = () => {
    const v = target.video;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return createPortal(
    <div
      className="vol"
      data-volume-ui=""
      style={size.boxH ? { height: `${size.boxH}px` } : undefined}
      onPointerDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="vol__box">
        <button type="button" className="vol__toggle" onClick={toggle} aria-label={playing ? dialog.pause : dialog.play}>
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <SloshGauge
          value={Math.round(level * 100)}
          onChange={(v) => setVolume(v / 100)}
          interactive
          showValue
          width={size.w}
          height={size.h}
          radius={Math.min(22, Math.round(size.w / 4))}
          ariaLabel={t.label}
        />
        <p className="vol__cap">{t.caption}</p>
      </div>
    </div>,
    target.wrap,
  );
}
