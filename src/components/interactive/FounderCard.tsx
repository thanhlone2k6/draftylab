// About the Founder card — React Bits Reflective Card, used WITHOUT any camera access (`webcam={false}`, never
// requested). The reflection source is optional: pass `reflectionSrc` (a tiny muted decorative loop) or nothing.
// On mobile / reduced motion / no WebGL2 / small screens the static card (server-rendered) is the final UI.
import { lazy, Suspense, useEffect, useState } from 'react';
import { getContent } from '../../i18n';
import type { Locale } from '../../i18n/config';

const ReflectiveCard = lazy(() => import('../react-bits/ReflectiveCard'));

interface Props {
  locale: Locale;
  portrait: string;
  alt: string;
  reflectionSrc?: string;
}

function CardFace({ about, portrait, alt }: { about: ReturnType<typeof getContent>['about']; portrait: string; alt: string }) {
  return (
    <div className="fc__face">
      {/* .fc__head is a column on desktop and a row on phones (portrait photo beside the ID), so the
          mobile card reads as a landscape badge instead of a very tall portrait one. */}
      <div className="fc__head">
        <img src={portrait} alt={alt} width={688} height={960} decoding="async" loading="lazy" />
        <div className="fc__id">
          <img className="fc__badge" src="/media/brand/drafty-lab-wordmark.png" alt={about.card.badge} width="2502" height="631" decoding="async" />
          <p className="fc__name">{about.card.name}</p>
          <p className="fc__role">{about.card.role}</p>
          {/* The 3 tag pills sit here, right under the role, on every layout (see .fc__tags). */}
          <ul className="fc__tags">
            {about.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
      <div className="fc__body">
        {about.body.map((p) => <p key={p} dangerouslySetInnerHTML={{ __html: p }} />)}
      </div>
    </div>
  );
}

export default function FounderCard({ locale, portrait, alt, reflectionSrc }: Props) {
  const about = getContent(locale).about;
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
        <CardFace about={about} portrait={portrait} alt={alt} />
      </div>
    );
  }
  return (
    <div className="fc fc--rc">
      <Suspense fallback={<div className="fc fc--static"><CardFace about={about} portrait={portrait} alt={alt} /></div>}>
        <ReflectiveCard width={340} height={500} radius={28} webcam={false} videoSrc={reflectionSrc} theme="dark" intro enableTilt tiltStrength={10}>
          <CardFace about={about} portrait={portrait} alt={alt} />
        </ReflectiveCard>
      </Suspense>
    </div>
  );
}
