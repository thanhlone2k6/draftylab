'use client';

import PixelCard from '../react-bits/PixelCard';
import type { CustomSkillDoc } from '../../data/custom-skill';

interface Props {
  copy: CustomSkillDoc;
}

export default function CustomSkillCard({ copy }: Props) {
  return (
    <div className="cso__pixel">
      <PixelCard
        variant="default"
        colors={['#f8fafc', '#f1f5f9', '#c59c4a']}
        glowColor="#c59c4a"
        shape="square"
        origin="center"
        gap={6}
        pixelSize={2}
        speed={30}
        revealDuration={600}
        spotlight={0.5}
        glow={0.7}
        opacity={0.5}
        fade={0.55}
        trigger="hover"
        radius={28}
        clickPulse
        intro
        theme="dark"
        noFocus={false}
        style={{}}
        className="cso-card-pixel"
      >
        <div className="cso-card">
          <div className="cso-card__top">
            <span className="cso-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.3-2 4-2 4s2.7-.5 4-2" />
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </span>
            <span className="cso-card__name">{copy.name}</span>
            <span className="cso-card__badge">{copy.badge}</span>
          </div>

          <div className="cso-card__price">
            <strong>{copy.price}</strong>
            <span>{copy.unit}</span>
          </div>
          <p className="cso-card__sub">{copy.subtitle}</p>

          <ul className="cso-card__list">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <button type="button" className="cso-card__cta" data-dfl-open="custom-skill" data-cso-cta>
            {copy.cta}
          </button>
        </div>
      </PixelCard>
    </div>
  );
}
