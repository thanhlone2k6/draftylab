'use client';
// Community tab: loads the published posts from /api/community, so a new post appears without rebuilding the site.
// Post text is shown as the owner wrote it in every language; only the labels passed in `copy` are translated.
//
// Layout (owner, 2026-11-05): desktop shows the first 3 cards, then the next row blurred under a
// "see more" button; phones show 4 cards (2 × 2) and the button below. Expanding shows every post.
import { useCallback, useEffect, useState } from 'react';
import ChromaGrid, { type ChromaItem } from '../react-bits/ChromaGrid';

interface Post {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  createdAt?: number;
}

interface Props {
  locale: string;
  copy: { empty: string; error: string; retry: string; posted: string; seeMore: string; showLess: string };
}

const ACCENT = '#c59c4a'; // --c-accent
const DESKTOP_SOLID = 3; // one row on a computer
const PHONE_SOLID = 4; // 2 × 2 on a phone
const TEASER = 3; // blurred row under the first one

const formatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatter = (locale: string) => {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    formatters.set(locale, f);
  }
  return f;
};

const ArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

export default function CommunityGrid({ locale, copy }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<ChromaItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/community?limit=all');
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: Post[] };
      const fmt = dateFormatter(locale);
      setItems(
        data.items.map((p) => {
          const posted = typeof p.createdAt === 'number' ? new Date(p.createdAt) : null;
          const valid = posted !== null && !Number.isNaN(posted.getTime());
          return {
            image: p.image,
            title: p.title,
            subtitle: p.description,
            url: p.url,
            alt: p.title,
            accent: ACCENT,
            date: valid ? fmt.format(posted) : undefined,
            dateTime: valid ? posted.toISOString() : undefined,
            dateLabel: valid ? copy.posted : undefined,
          };
        }),
      );
      setState('ready');
    } catch {
      setState('error');
    }
  }, [locale, copy.posted]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <div className="cmt__skeletons" aria-hidden="true">
        <span className="cmt__skeleton" />
        <span className="cmt__skeleton" />
        <span className="cmt__skeleton" />
        <span className="cmt__skeleton" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="cmt__state" role="alert">
        <p>{copy.error}</p>
        <button type="button" className="btn btn-primary" onClick={() => void load()}>{copy.retry}</button>
      </div>
    );
  }
  if (!items.length) return <p className="cmt__state">{copy.empty}</p>;

  const main = expanded ? items : items.slice(0, PHONE_SOLID);
  const teaser = items.slice(DESKTOP_SOLID, DESKTOP_SOLID + TEASER);
  const moreOnDesktop = items.length > DESKTOP_SOLID;
  const moreOnPhone = items.length > PHONE_SOLID;

  const gridProps = {
    items: main,
    columns: DESKTOP_SOLID,
    mobileColumns: 2,
    gap: 16,
    reveal: 'card' as const,
    aspectRatio: '1 / 1',
    grayscale: 0,
    dim: 0,
  };

  return (
    <div className={`cmt-grid${expanded ? ' is-expanded' : ''}`}>
      <ChromaGrid {...gridProps} className="cmt-grid__main" />

      {!expanded && moreOnDesktop && (
        <div className="cmt-teaser">
          <div className="cmt-teaser__blur" aria-hidden="true" inert>
            <ChromaGrid {...gridProps} items={teaser} />
          </div>
          <div className="cmt-teaser__cover">
            <button type="button" className="cmt-more" onClick={() => setExpanded(true)}>
              {copy.seeMore}
              <ArrowDown />
            </button>
          </div>
        </div>
      )}

      {!expanded && moreOnPhone && (
        <div className="cmt-more-row">
          <button type="button" className="cmt-more cmt-more-inline" onClick={() => setExpanded(true)}>
            {copy.seeMore}
            <ArrowDown />
          </button>
        </div>
      )}

      {expanded && (
        <div className="cmt-more-row">
          <button type="button" className="cmt-more cmt-more-inline cmt-more--less" onClick={() => setExpanded(false)}>
            {copy.showLess}
          </button>
        </div>
      )}
    </div>
  );
}
