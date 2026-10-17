import { useCallback, useEffect, useMemo } from 'react';
import { dfl, requestFor, type DialogRequest } from '../../lib/dialog';
import { getMedia, sectionMedia, brands, brandMedia, type MediaItem } from '../../lib/media';
import { howIWork as processContent } from '../../data/content';

/** Items of a lightbox group: 'gallery' or 'social-<brandId>'. */
export function groupItems(group: string): MediaItem[] {
  if (group === 'gallery') return sectionMedia('gallery');
  if (group === 'behind') return sectionMedia('behind-raw-final');
  if (group === 'ai-workflow') return sectionMedia('behind-ai-workflow');
  if (group.startsWith('how-')) {
    const stage = processContent.stages.find((st) => `how-${st.id}` === group);
    return stage ? (stage.mediaIds.map((id) => getMedia(id)).filter(Boolean) as MediaItem[]) : [];
  }
  if (group.startsWith('social-')) {
    const brand = brands.find((b) => `social-${b.id}` === group);
    return brand ? brandMedia(brand) : [];
  }
  return [];
}

export function useGroupNav(req: Extract<DialogRequest, { id: string }>) {
  const items = useMemo(() => groupItems(req.group), [req.group]);
  const index = items.findIndex((m) => m.id === req.id);
  const count = items.length;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < count - 1;

  // Called from a click/keydown → still a user gesture, so video playback with sound is allowed.
  const go = useCallback(
    (delta: number) => {
      const target = items[index + delta];
      if (target) dfl()?.open(requestFor(target, req.group));
    },
    [items, index, req.group],
  );
  return { items, index, count, hasPrev, hasNext, prev: () => go(-1), next: () => go(1), current: getMedia(req.id) };
}

/** Keyboard shortcuts while a media dialog is open. */
export function useDialogKeys(handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dfl()?.isOpen() || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      handler(e);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler]);
}
