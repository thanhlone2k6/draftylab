// Image lightbox UI: the <img> lives in the static shell; this adds next/prev, counter and ←/→ keys.
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { DialogRequest } from '../../lib/dialog';
import { getContent } from '../../i18n';
import type { Locale } from '../../i18n/config';
import { useDialogKeys, useGroupNav } from './useGroupNav';
import { IconNext, IconPrev } from './icons';

type Req = Extract<DialogRequest, { id: string }>;
interface Slots { nav: HTMLElement | null; counter: HTMLElement | null }

export default function ImageLightbox({ req, slots, locale }: { req: Req; slots: Slots; locale: Locale }) {
  const t = getContent(locale).dialog;
  const nav = useGroupNav(req);
  useDialogKeys(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && nav.hasPrev) { e.preventDefault(); nav.prev(); }
        else if (e.key === 'ArrowRight' && nav.hasNext) { e.preventDefault(); nav.next(); }
      },
      [nav],
    ),
  );
  if (nav.count < 2) return null;
  return (
    <>
      {slots.nav &&
        createPortal(
          <>
            <button type="button" className="lb-nav lb-nav--prev" onClick={nav.prev} disabled={!nav.hasPrev} aria-label={t.prev}>
              <IconPrev />
            </button>
            <button type="button" className="lb-nav lb-nav--next" onClick={nav.next} disabled={!nav.hasNext} aria-label={t.next}>
              <IconNext />
            </button>
          </>,
          slots.nav,
        )}
      {slots.counter && createPortal(<span aria-live="polite">{nav.index + 1} / {nav.count}</span>, slots.counter)}
    </>
  );
}
