// Hero background: React Bits Dot Grid with the verified Background Studio "dense" preset.
// Pointer tracking is on window (passive) and the canvas is pointer-events:none, so it never
// blocks the CTAs; click shocks are ignored on interactive elements and the Lanyard.
import { useEffect, useState } from 'react';
import DotGrid from '../react-bits/DotGrid';
import { DOT_GRID_DENSE } from '../../data/dotgrid-presets';

export default function HeroDotGrid() {
  const [env, setEnv] = useState({ hover: true, reduced: false, mobile: false });
  useEffect(() => {
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    const read = () => setEnv({ hover: hover.matches, reduced: reduced.matches, mobile: mobile.matches });
    read();
    [hover, reduced, mobile].forEach((m) => m.addEventListener('change', read));
    return () => [hover, reduced, mobile].forEach((m) => m.removeEventListener('change', read));
  }, []);

  return (
    <DotGrid
      {...DOT_GRID_DENSE}
      baseColor="#2b2b2b"
      activeColor="#fafafa"
      fade={0.35}
      mouseInteraction={env.hover && !env.reduced}
      clickShock={env.hover && !env.reduced}
      intro={!env.reduced}
      paused={env.reduced}
      dpr={env.mobile ? 1 : 1.5}
      shockIgnore="a, button, input, [data-no-shock]"
    />
  );
}
