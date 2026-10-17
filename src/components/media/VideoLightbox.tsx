// Video lightbox UI. The <video> element itself is static in the dialog shell and its source is set
// synchronously by the bootstrap inside the click (V1 behaviour: playsinline, preload=metadata,
// play with sound → muted retry). This component adds the V1 controls (play/pause, seek, time, mute)
// plus next/prev within the group, keyboard shortcuts and live status for assistive tech.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DialogRequest } from '../../lib/dialog';
import { fmtTime } from '../../lib/dialog';
import { dialog as t } from '../../data/content';
import { useDialogKeys, useGroupNav } from './useGroupNav';
import { IconMuted, IconNext, IconPause, IconPlay, IconPrev, IconSound } from './icons';

type Req = Extract<DialogRequest, { id: string }>;
interface Slots { controls: HTMLElement | null; nav: HTMLElement | null; counter: HTMLElement | null }

export default function VideoLightbox({ req, slots }: { req: Req; slots: Slots }) {
  const nav = useGroupNav(req);
  const video = useRef<HTMLVideoElement | null>(null);
  const shell = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mutedFallback, setMutedFallback] = useState(false);
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const seeking = useRef(false);

  useEffect(() => {
    video.current = document.getElementById('dfl-video') as HTMLVideoElement | null;
    shell.current = document.getElementById('dfl-dialog');
  }, []);

  // Sync UI state from the shared <video> element (it may already be playing when React mounts).
  useEffect(() => {
    const v = document.getElementById('dfl-video') as HTMLVideoElement | null;
    const sh = document.getElementById('dfl-dialog');
    if (!v || !sh) return;
    const sync = () => {
      setPlaying(!v.paused && !v.ended);
      setMuted(v.muted);
      setMutedFallback(sh.hasAttribute('data-muted-fallback') && v.muted);
      if (!seeking.current) setTime({ cur: v.currentTime || 0, dur: isFinite(v.duration) ? v.duration : 0 });
    };
    sync();
    const evs = ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'durationchange', 'volumechange', 'emptied'];
    evs.forEach((e) => v.addEventListener(e, sync));
    const mo = new MutationObserver(sync);
    mo.observe(sh, { attributes: true, attributeFilter: ['data-muted-fallback'] });
    return () => {
      evs.forEach((e) => v.removeEventListener(e, sync));
      mo.disconnect();
    };
  }, [req.id]);

  const togglePlay = useCallback(() => {
    const v = video.current;
    if (!v || req.pending) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [req.pending]);

  const toggleMute = useCallback(() => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) shell.current?.removeAttribute('data-muted-fallback');
  }, []);

  const seekTo = (fraction: number) => {
    const v = video.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.min(Math.max(fraction, 0), 1) * v.duration;
  };

  useDialogKeys(
    useCallback(
      (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement | null)?.tagName;
        const v = video.current;
        if ((e.key === ' ' || e.key === 'k' || e.key === 'K') && tag !== 'BUTTON') {
          e.preventDefault();
          togglePlay();
        } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && v && v.duration && (e.target as HTMLElement)?.getAttribute('type') !== 'range') {
          e.preventDefault();
          v.currentTime = Math.min(Math.max(v.currentTime + (e.key === 'ArrowLeft' ? -5 : 5), 0), v.duration);
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute();
        } else if (e.key === 'PageDown' || e.key === 'n' || e.key === 'N') {
          if (nav.hasNext) { e.preventDefault(); nav.next(); }
        } else if (e.key === 'PageUp' || e.key === 'p' || e.key === 'P') {
          if (nav.hasPrev) { e.preventDefault(); nav.prev(); }
        }
      },
      [togglePlay, toggleMute, nav],
    ),
  );

  const pct = time.dur > 0 ? Math.round((time.cur / time.dur) * 1000) : 0;

  const controls = req.pending ? null : (
    <div className="lb-controls" role="group" aria-label="Điều khiển video">
      <button type="button" className="lb-btn" onClick={togglePlay} aria-label={playing ? t.pause : t.play}>
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <input
        className="lb-seek"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={pct}
        aria-label={t.seek}
        aria-valuetext={`${fmtTime(time.cur)} / ${fmtTime(time.dur)}`}
        onPointerDown={() => (seeking.current = true)}
        onPointerUp={() => (seeking.current = false)}
        onChange={(e) => {
          const f = Number(e.currentTarget.value) / 1000;
          setTime((s) => ({ ...s, cur: f * s.dur }));
          seekTo(f);
        }}
        style={{ ['--lb-pct' as string]: `${pct / 10}%` }}
      />
      <span className="lb-time" aria-hidden="true">{fmtTime(time.cur)} / {fmtTime(time.dur)}</span>
      <button type="button" className="lb-btn" onClick={toggleMute} aria-label={muted ? t.unmute : t.mute} aria-pressed={muted}>
        {muted ? <IconMuted /> : <IconSound />}
      </button>
      {mutedFallback && (
        <button type="button" className="lb-unmute" onClick={toggleMute}>
          {t.mutedNotice}
        </button>
      )}
      <span className="sr-only" aria-live="polite">{mutedFallback ? t.mutedNotice : ''}</span>
    </div>
  );

  const navUi = nav.count > 1 && (
    <>
      <button type="button" className="lb-nav lb-nav--prev" onClick={nav.prev} disabled={!nav.hasPrev} aria-label={`${t.prev}`}>
        <IconPrev />
      </button>
      <button type="button" className="lb-nav lb-nav--next" onClick={nav.next} disabled={!nav.hasNext} aria-label={`${t.next}`}>
        <IconNext />
      </button>
    </>
  );

  return (
    <>
      {slots.controls && controls && createPortal(controls, slots.controls)}
      {slots.nav && navUi && createPortal(navUi, slots.nav)}
      {slots.counter && nav.count > 1 && createPortal(<span aria-live="polite">{nav.index + 1} / {nav.count}</span>, slots.counter)}
    </>
  );
}
