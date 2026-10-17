// Founder visual: React Bits Lanyard wherever WebGL2 is available (desktop AND mobile), unless reduced motion.
// The static portrait card is server-rendered and stays until the 3D card is ready, so there is
// never an empty column; on reduced motion / no WebGL the static card is the final UI.
import { lazy, Suspense, useEffect, useState } from 'react';

const Lanyard = lazy(() => import('../react-bits/Lanyard'));

export default function HeroLanyard({ portrait, alt }: { portrait: string; alt: string }) {
  const [use3d, setUse3d] = useState(false);
  const [ready, setReady] = useState(false);
  // Phones get a shorter strap and a larger card: the hero must read as one frame there, and a long
  // strap hanging from the header looks like a loose string. Desktop keeps the original smaller card
  // (0.65 reads as too big on a full desktop hero), so only the canvas height changes there.
  const [compact, setCompact] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const ok =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !!document.createElement('canvas').getContext('webgl2');
    setUse3d(ok);
    if (ok) {
      // Lanyard draws on its own canvas; reveal it after the first frames have rendered.
      const t = window.setTimeout(() => setReady(true), 900);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 767px)');
    const wide = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      setCompact(phone.matches);
      setDesktop(wide.matches);
    };
    sync();
    phone.addEventListener('change', sync);
    wide.addEventListener('change', sync);
    return () => {
      phone.removeEventListener('change', sync);
      wide.removeEventListener('change', sync);
    };
  }, []);

  return (
    <div className="hl" data-ready={ready ? '' : undefined} data-no-shock="">
      <figure className="hl__static" aria-hidden={use3d && ready ? true : undefined}>
        <img src={portrait} alt={alt} width={688} height={960} decoding="async" fetchPriority="high" />
      </figure>
      {use3d && (
        <div className="hl__3d" aria-hidden="true">
          <Suspense fallback={null}>
            <Lanyard
              frontImage={portrait}
              imageFit="cover"
              cardColor="#0a0a0a"
              size={desktop ? 0.55 : 0.65}
              strapLength={compact ? 0.3 : 0.4}
              strapColor="#141414"
              metal="graphite"
              finish="glossy"
              breeze={0.35}
            />
          </Suspense>
        </div>
      )}
      {use3d && ready && <span className="sr-only">{alt}</span>}
    </div>
  );
}
