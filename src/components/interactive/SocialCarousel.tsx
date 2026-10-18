'use client';
// Social Production — React Bits **CircularCarousel** in the panorama preset (owner's settings:
// Panorama · Rise · Portrait · 220px · gap 19 · curve 1 · tilt 0° · Drift 8°/s left · momentum .6 ·
// parallax .3 · stretch .5 · snap + pause-on-hover + focus-on-click + draggable on · fade #120f17 ·
// depth fade .55 · inner shade .6 · radius 12 · captions off).
// Every Social Production photo is one card in the ring, and the drift never stops — the loop is
// infinite by construction (no snap-back, no clone list). Replaced the old drifting brand rail on
// 2026-10-18; the rail components are parked, not deleted.
import CircularCarousel from '../react-bits/CircularCarousel';
import { sectionMedia } from '../../lib/media';

/** All Social Production photos, in manifest order (brand by brand). Each becomes one card. */
const SOCIAL_PHOTOS = sectionMedia('social').map((m) => ({ src: m.posterSrc, alt: m.alt, title: m.title }));

export default function SocialCarousel() {
  return (
    <CircularCarousel
      items={SOCIAL_PHOTOS}
      preset="panorama"
      intro="rise"
      cardWidth={220}
      aspectRatio={0.75}
      gap={19}
      curve={1}
      tilt={0}
      autoplay="drift"
      speed={8}
      direction="left"
      momentum={0.6}
      parallax={0.3}
      stretch={0.5}
      snap
      pauseOnHover
      focusOnClick
      draggable
      fadeColor="#120f17"
      depthFade={0.55}
      innerShade={0.6}
      cornerRadius={12}
      captions={false}
      className="sp__ring-inner"
    />
  );
}
