// Trusted-by — the partner logos as a React Bits <LogoLoop /> marquee.
// Maps `partners` (src/data/partners.ts) to loop items and keeps the two logo treatments from the old static row:
//   • kind 'logo'  → dark line-art, inverted for the dark theme
//   • kind 'photo' → square tile with rounded corners
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
  // Fade Out on · Step off · Draggable on · Scale on Hover off · Intro on).
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
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}
    />
  );
}
