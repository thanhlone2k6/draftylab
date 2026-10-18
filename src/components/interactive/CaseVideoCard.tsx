'use client';
// App-style video card for Case Studies (owner, 2026-10-18): poster + platform chip/logo + view count; the
// muted preview plays on hover (tap on touch); the bar has play/pause, sound, scrub; the pill opens the
// original post. Only VIEWS are shown — likes/comments/shares were not supplied and are never invented.
import { useEffect, useId, useRef, useState } from 'react';
import { getVolume } from '../../lib/volume';
import CountUp from '../react-bits/CountUp';
import { IconPlay, IconPause, IconSound, IconMuted } from '../media/icons';
import './CaseVideoCard.css';

export type CasePlatform = 'tiktok' | 'instagram';
interface Props {
  platform: CasePlatform;
  platformName: string;
  views: string;
  viewsTo: number;
  viewsDecimals: number;
  creator: string;
  viewsLabel: string;
  url: string;
  ctaLabel: string;
  ariaLabel: string;
  posterSrc: string;
  previewSrc: string;
  aspect: number;
  hasAudio: boolean;
  playLabel: string;
  pauseLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  seekLabel: string;
}

const TikTokGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="cvc__logo-svg">
    <path fill="#25f4ee" transform="translate(-0.9 -0.9)" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.7-5.7 0-.5 0-1 0-1.5.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.7v4.4c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.7-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.4 0-4 0-8.1 0-12.1z" />
    <path fill="#fe2c55" transform="translate(0.9 0.9)" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.7-5.7 0-.5 0-1 0-1.5.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.7v4.4c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.7-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.4 0-4 0-8.1 0-12.1z" />
    <path fill="#fff" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.7-5.7 0-.5 0-1 0-1.5.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.7v4.4c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.7-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.4 0-4 0-8.1 0-12.1z" />
  </svg>
);
const InstagramGlyph = ({ id }: { id: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="cvc__logo-svg">
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".6" stopColor="#d62976" /><stop offset=".85" stopColor="#962fbf" /><stop offset="1" stopColor="#4f5bd5" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill={`url(#${id})`} />
    <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="16.6" cy="7.4" r="1.1" fill="#fff" />
  </svg>
);
// Eye icon next to the view count on every card (owner).
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5C6.8 5.5 3 9.4 1.6 12c1.4 2.6 5.2 6.5 10.4 6.5s9-3.9 10.4-6.5C21 9.4 17.2 5.5 12 5.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.2" fill="currentColor" /></svg>
);

export default function CaseVideoCard(p: Props) {
  const vref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false); // video element mounted (first interaction)
  const reduced = useRef(false);
  const userPaused = useRef(false); // an explicit pause sticks until the pointer leaves (some engines re-fire pointerenter on child moves)
  const uid = `cvc-ig-${useId().replace(/:/g, '')}`;

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  const [playReq, setPlayReq] = useState(0); // bumped to ask the (possibly not-yet-mounted) <video> to play
  const start = () => { setActive(true); setPlayReq((n) => n + 1); };
  useEffect(() => {
    const v = vref.current; if (!v || playReq === 0) return;
    v.muted = muted; v.volume = getVolume();
    v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playReq, active]);
  const stop = (reset: boolean) => {
    const v = vref.current; if (!v) return;
    v.pause(); if (reset) { v.currentTime = 0; setProgress(0); }
  };
  const toggle = () => { const v = vref.current; if (!v || v.paused) { userPaused.current = false; start(); } else { userPaused.current = true; stop(false); } };
  const toggleMute = () => {
    const v = vref.current; const next = !muted; setMuted(next);
    if (v) { v.muted = next; v.volume = getVolume(); }
    if (!v) setActive(true);
  };
  const seek = (value: number) => {
    const v = vref.current; if (!v || !v.duration) return;
    v.currentTime = (value / 1000) * v.duration; setProgress(value / 1000);
  };

  return (
    <div className="cvw">
    <div
      className={`cvc cvc--${p.platform}`}
      data-playing={playing ? '' : undefined}
      style={{ aspectRatio: String(p.aspect) }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !reduced.current && !userPaused.current && !playing) start(); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') { userPaused.current = false; stop(true); } }}
      onKeyUp={(e) => { if (e.key === 'Tab' && !reduced.current && !playing) start(); }}
    >
      <img className="cvc__poster" src={p.posterSrc} alt="" width={608} height={1080} loading="lazy" decoding="async" />
      {active && (
        <video ref={vref} className="cvc__video" src={p.previewSrc} playsInline loop preload="auto" muted={muted}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }} />
      )}
      <button type="button" className="cvc__tap" aria-label={playing ? p.pauseLabel : p.playLabel} onClick={toggle} />
      <div className="cvc__shade" aria-hidden="true" />

      <span className="cvc__chip"><span className="cvc__dot" />{p.platformName}</span>
      <span className="cvc__logo">{p.platform === 'tiktok' ? <TikTokGlyph /> : <InstagramGlyph id={uid} />}</span>

      <div className="cvc__bar">
        <button type="button" className="cvc__btn" aria-label={playing ? p.pauseLabel : p.playLabel} onClick={toggle}>
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <input className="cvc__seek" type="range" min={0} max={1000} value={Math.round(progress * 1000)} aria-label={p.seekLabel}
          onChange={(e) => seek(Number(e.target.value))} style={{ ['--p' as string]: `${progress * 100}%` }} />
        {p.hasAudio && (
          <button type="button" className="cvc__btn" aria-label={muted ? p.unmuteLabel : p.muteLabel} onClick={toggleMute}>
            {muted ? <IconMuted /> : <IconSound />}
          </button>
        )}
      </div>

      <a className="cvc__cta" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={p.ariaLabel}>
        {p.ctaLabel}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
    </div>
    <div className="cvw__meta">
      <p className="cvw__views" aria-label={`${p.views} ${p.viewsLabel}`}>
        <EyeIcon />
        <CountUp from={0} to={p.viewsTo} mode="roll" easing="easeOut" format="compact" separator="," prefix="" suffix="" direction="up" duration={1.8} delay={0} trigger="view" replayOnHover decimals={p.viewsDecimals} className="cvw__num" />
      </p>
      <p className="cvw__creator">{p.creator}</p>
    </div>
    </div>
  );
}
