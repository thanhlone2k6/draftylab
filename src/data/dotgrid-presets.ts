// React Bits Background Studio — Dot Grid presets.
// VERIFIED 2026-10-17 from the official bundle (reactbits.dev/assets/DotGrid-*.js, export PRESETS).
// Colors are not part of a preset; they come from the site theme tokens.
const FEEL = {
  shape: 'circle' as const,
  dotSize: 5, gap: 18, proximity: 140, strength: 1, bounce: 0.6, tension: 0.4, returnDuration: 0.8,
  shockRadius: 320, shockStrength: 5, swell: 0.8, stretch: 0.5, glow: 0.5, fade: 0,
};

export const DOT_GRID_DENSE = { ...FEEL, dotSize: 3, gap: 10, proximity: 170, tension: 0.55, swell: 1.2, glow: 0.6 };
