'use client';
// "Skill AI x Claude" shelf: loads the skills the owner publishes in /admin and renders React Bits AnimatedList.
// Skill text is shown exactly as the owner typed it; only the page's own labels are translated.
import { useCallback, useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CodeIcon } from '@hugeicons/core-free-icons';
import AnimatedList, { type AnimatedListItem } from '../react-bits/AnimatedList';

interface Skill {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
}

interface Props {
  copy: { error: string; retry: string; empty: string };
}

const ACCENT = '#c59c4a'; // --c-accent

export default function SkillList({ copy }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<AnimatedListItem[]>([]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/community/skills');
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: Skill[] };
      setItems(
        data.items.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          meta: 'GitHub',
          url: s.url,
          image: s.image ?? undefined,
          icon: s.image ? undefined : <HugeiconsIcon icon={CodeIcon} size={18} strokeWidth={1.8} />,
        })),
      );
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <div className="cmt-skills__skel" aria-hidden="true">
        <span />
        <span />
        <span />
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
    <AnimatedList
      items={items}
      onItemSelect={(item: AnimatedListItem) => {
        const url = (item as AnimatedListItem).url;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      }}
      animation="pop"
      animateOnce
      stagger={0.06}
      theme="dark"
      accentColor={ACCENT}
      width={1000}
      maxHeight="none"
      radius={14}
      gap={8}
      frame
    />
  );
}
