// Bridge to the inline session volume store (src/scripts/volume-store.js), same pattern as lib/dialog.ts.
// React islands read/subscribe; plain scripts (the preview controller, the dialog bootstrap) use window.__dflVolume.
import { useCallback, useSyncExternalStore } from 'react';

export const DEFAULT_VOLUME = 0.5;

interface VolumeStore {
  DEFAULT: number;
  get: () => number;
  set: (v: number) => number;
  subscribe: (fn: (level: number) => void) => () => void;
}

declare global {
  interface Window {
    __dflVolume?: VolumeStore;
  }
}

const detached: VolumeStore = {
  DEFAULT: DEFAULT_VOLUME,
  get: () => DEFAULT_VOLUME,
  set: () => DEFAULT_VOLUME,
  subscribe: () => () => {},
};

/** The store, or an inert 50% fallback (SSR / before the inline script runs). */
export const volumeStore = (): VolumeStore => (typeof window !== 'undefined' && window.__dflVolume ? window.__dflVolume : detached);

export const getVolume = () => volumeStore().get();
export const setVolume = (v: number) => volumeStore().set(v);
export const subscribeVolume = (fn: (level: number) => void) => volumeStore().subscribe(fn);

/** Current level (0–1), re-rendering the caller when it changes. */
export function useVolume(): number {
  const store = volumeStore();
  return useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), [store]),
    () => store.get(),
    () => DEFAULT_VOLUME,
  );
}
