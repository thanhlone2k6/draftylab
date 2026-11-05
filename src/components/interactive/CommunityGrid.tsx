'use client';
// Community tab: loads the 3 newest posts from /api/community, so a new post appears without rebuilding the site.
// Post text is shown as the owner wrote it in every language; only the labels passed in `copy` are translated.
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
  copy: { empty: string; error: string; retry: string; posted: string };
}

const ACCENT = '#c59c4a'; // --c-accent

const formatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatter = (locale: string) => {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    formatters.set(locale, f);
  }
  return f;
};

export default function CommunityGrid({ locale, copy }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<ChromaItem[]>([]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/community');
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
  return (
    <ChromaGrid
      items={items}
      columns={3}
      mobileColumns={2}
      gap={16}
      reveal="card"
      aspectRatio="1 / 1"
    />
  );
}
