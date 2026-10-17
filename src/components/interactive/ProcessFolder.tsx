// One "How I Work" stage as a React Bits Folder. Opening is by click/tap/Enter (never hover); papers show the
// real photos/video poster of that stage. Clicking a paper opens the global lightbox (image or video).
// Dragging papers out of the folder is disabled so touch scrolling and clicks stay predictable.
import { useEffect, useRef, useState } from 'react';
import Folder from '../react-bits/Folder';
import { getMedia, type MediaItem } from '../../lib/media';

interface Props {
  label: string;
  mediaIds: string[];
  openLabel: string;
  /** folder body colour — each stage gets its own tone (see content.ts) */
  color?: string;
}

export default function ProcessFolder({ label, mediaIds, openLabel, color }: Props) {
  const items = mediaIds.map((id) => getMedia(id)).filter(Boolean) as MediaItem[];
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(1);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = wrap.current;
    if (!el) return;
    // The folder is 224px wide at size 1; open papers fan out to ±25% — fit the column (min 0.85, max 1.1).
    const ro = new ResizeObserver(([e]) => setSize(Math.min(1.1, Math.max(0.85, e.contentRect.width / 300))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="pf" aria-label={openLabel}>
      <Folder
        label={label}
        size={size}
        color={color ?? '#3a3a3d'}
        paperColor="#f4f4f5"
        variant="solid"
        tabPosition="left"
        theme="dark"
        draggable={false}
        zoomOnClick={false}
        peek={!reduced}
        intro={!reduced}
        speed={reduced ? 3 : 1}
        items={items.map((m) => ({ title: m.title, image: m.posterSrc, alt: m.alt }))}
      />
    </div>
  );
}
