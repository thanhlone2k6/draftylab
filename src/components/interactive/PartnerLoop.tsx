// Trusted-by — DESKTOP ONLY: the partner logos as a React Bits <LogoLoop /> marquee (the "Dock" preset).
// Phones never load this island — `TrustedBy.astro` renders a plain CSS marquee for ≤767px and gates this
// component with `client:media="(min-width: 768px)"`, so a phone gets no engine, no ResizeObserver and no
// hydration (owner, 2026-10-19: the measured marquee kept rendering uneven on iOS). Keep the two in sync:
// same `partners` data, same inverted line-art / rounded photo treatments.
// Maps `partners` (src/data/partners.ts) to loop items and keeps the two logo treatments from the old static row:
//   • kind 'logo'  → dark line-art, inverted for the dark theme
//   • kind 'photo' → square tile with rounded corners
// The logos are ~100 KB in total and sit at the fold, but `loading="lazy"` on them was a trap: the
// marquee clips (`overflow: clip`) and translates its track, and WebKit in particular then kept an image
// unloaded (naturalWidth 0 → an empty slot in the row), so they load eagerly instead.
import LogoLoop, { type LogoItem } from '../react-bits/LogoLoop';
import { partners } from '../../data/partners';
import { trusted } from '../../data/content';
import './PartnerLoop.css';

type PartnerLogo = LogoItem & { kind: 'logo' | 'photo' };

export default function PartnerLoop() {
  const logos: PartnerLogo[] = partners.map(p => ({
    src: p.logo,
    alt: p.name,
    title: p.name,
    href: p.url,
    width: p.width,
    height: p.height,
    kind: p.kind
  }));

  // Settings match the React Bits "Dock" preset (Layout Line · Direction Left · Labels On Hover · Speed 100 ·
  // Hover Speed 30 · Logo Height 44 · Gap 44 · Focus 0 · Magnify 0.8 · Muted 0.5 · Tilt 0 · Fade Width 0.12 ·
  // Fade Out on · Step off · Draggable on · Scale on Hover off).
  // `intro` is OFF, unlike the preset (2026-10-18, owner reported the row showing broken on phones): the
  // intro pre-hides EVERY item in CSS (`[data-intro] .logo__item { opacity: 0 }`) and then replays a
  // left→right wave with a 0.45s stagger + 0.7s fade, so for up to ~1.15s after the loop scrolls into view
  // the marquee is blank or half-filled (a few logos, then empty gaps) — and on a phone this row sits right
  // at the fold, so that is what you see on load. With intro off the logos are in the SSR HTML and visible
  // immediately (and a no-JS visitor sees them too). Flip it back here if the wave is ever wanted.
  // renderItem stays on (the customizer's "Custom Render"): the two logo kinds need per-item treatment
  // (line-art inverted for the dark theme, photo tiles rounded) that the default image render can't express.
  return (
    <LogoLoop
      logos={logos}
      speed={100}
      direction="left"
      logoHeight={44}
      gap={44}
      labels="hover"
      hoverSpeed={30}
      magnify={0.8}
      muted={0.5}
      focus={0}
      fadeOut
      fadeOutWidth={0.12}
      draggable
      intro={false}
      ariaLabel={trusted.title}
      renderItem={(item, key) => (
        <img
          key={key}
          className={`pl__img pl__img--${(item as PartnerLogo).kind}`}
          src={item.src}
          alt={item.alt ?? ''}
          title={item.title}
          width={item.width}
          height={item.height}
          decoding="async"
          draggable={false}
        />
      )}
    />
  );
}
