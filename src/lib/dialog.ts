// Bridge to the inline dialog bootstrap (src/scripts/dialog-bootstrap.js).
import type { MediaItem } from './media';
import { isPlayable } from './media';

export type DialogRequest =
  | { kind: 'quickcall' }
  | { kind: 'video' | 'image'; id: string; group: string; title: string; poster: string; aspect: number; src: string; pending: boolean };

export interface DialogHost {
  show: (req: DialogRequest) => void;
  hide: () => void;
}

interface DflGlobal {
  open: (req: DialogRequest, trigger?: Element | null) => void;
  close: () => void;
  isOpen: () => boolean;
  register: (host: DialogHost) => void;
  unregister: (host: DialogHost) => void;
}

declare global {
  interface Window {
    __dfl?: DflGlobal;
  }
}

export const dfl = () => (typeof window !== 'undefined' ? window.__dfl : undefined);

export function requestFor(m: MediaItem, group: string): DialogRequest {
  return {
    kind: m.type,
    id: m.id,
    group,
    title: m.title,
    poster: m.posterSrc,
    aspect: m.aspectRatio,
    src: m.type === 'image' ? m.fullImageSrc ?? m.posterSrc : isPlayable(m) ? m.videoSrc! : '',
    pending: m.type === 'video' && !isPlayable(m),
  };
}

/** Open from React; must be called synchronously inside the click handler (user gesture). */
export function openMedia(m: MediaItem, group: string, trigger?: Element | null) {
  dfl()?.open(requestFor(m, group), trigger ?? (document.activeElement as Element | null));
}

export const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
