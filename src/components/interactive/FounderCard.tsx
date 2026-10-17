// About the Founder card — React Bits Reflective Card, used WITHOUT any camera access (`webcam={false}`, never
// requested). The reflection source is optional: pass `reflectionSrc` (a tiny muted decorative loop) or nothing.
// On mobile / reduced motion / no WebGL2 / small screens the static card (server-rendered) is the final UI.
import { lazy, Suspense, useEffect, useState } from 'react';
import { about } from '../../data/content';

const ReflectiveCard = lazy(() => import('../react-bits/ReflectiveCard'));

interface Props {
  portrait: string;
  alt: string;
  reflectionSrc?: string;
}

function CardFace({ portrait, alt }: { portrait: string; alt: string }) {
  return (
    <div className="fc__face">
      <img src={portrait} alt={alt} width={688} height={960} decoding="async" loading="lazy" />
      <div className="fc__id">
        <span className="fc__badge">{about.card.badge}</span>
        <p className="fc__name">{about.card.name}</p>
        <p className="fc__role">{about.card.role}</p>
      </div>
    </div>
  );
}

export default function FounderCard({ portrait, alt, reflectionSrc }: Props) {
  const [fancy, setFancy] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !!document.createElement('canvas').getContext('webgl2');
    setFancy(ok);
  }, []);

  if (!fancy) {
    return (
      <div className="fc fc--static">
        <CardFace portrait={portrait} alt={alt} />
      </div>
    );
  }
  return (
    <div className="fc fc--rc">
      <Suspense fallback={<div className="fc fc--static"><CardFace portrait={portrait} alt={alt} /></div>}>
        <ReflectiveCard width={340} height={500} radius={28} webcam={false} videoSrc={reflectionSrc} theme="dark" intro enableTilt tiltStrength={10}>
          <CardFace portrait={portrait} alt={alt} />
        </ReflectiveCard>
      </Suspense>
    </div>
  );
}
