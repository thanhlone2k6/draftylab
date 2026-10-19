// Quick Call CTA button — React Bits <StarBorder /> on a white surface. The animated light travels the border,
// laps once on hover, and pulses out from the click point; the gold tone ties to the site accent.
// `data-dfl-open` is forwarded to the element so the dialog bootstrap still opens the Quick Call dialog.
import StarBorder from '../react-bits/StarBorder';
import { getContent } from '../../i18n';
import type { Locale } from '../../i18n/config';

interface Props { locale: Locale }

export default function QuickCallButton({ locale }: Props) {
  return (
    <StarBorder
      color="#c59c4a"
      trailColor="#8f6f2e"
      duration={4}
      direction="clockwise"
      stars={1}
      trailLength={0.4}
      thickness={2}
      radius={999}
      glow={0.8}
      hover="lap"
      sparkle
      clickPulse
      theme="light"
      backgroundColor="#ffffff"
      textColor="#0a0a0a"
      borderColor="rgba(10, 10, 10, 0.14)"
      data-dfl-open="quickcall"
      style={{ padding: '1.05rem 2.5rem', fontSize: '1.06rem', fontWeight: 600, minHeight: 58 }}
    >
      {getContent(locale).quickCall.cta}
    </StarBorder>
  );
}
