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

/** The inline audio-level bridge (src/scripts/audio-level.js). `settable` is false on iOS Safari, where the
 *  bridge routes the element through a Web Audio gain instead of the read-only `volume` property. */
interface AudioBridge {
  settable: boolean;
  apply: (el: HTMLMediaElement, level: number, muted: boolean) => void;
  resume: () => void;
}

declare global {
  interface Window {
    __dflVolume?: VolumeStore;
    __dflAudio?: AudioBridge;
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

const detachedAudio: AudioBridge = {
  settable: true,
  apply: (el, level, muted) => {
    el.volume = level;
    el.muted = muted;
  },
  resume: () => {},
};

/** The audio-level bridge, or an inert native fallback (SSR / before the inline script runs). */
export const audioBridge = (): AudioBridge => (typeof window !== 'undefined' && window.__dflAudio ? window.__dflAudio : detachedAudio);

/** Puts a media element at `level` (0–1) with its mute state, through the audio bridge: on iOS Safari, where
 *  `HTMLMediaElement.volume` is read-only, the bridge drives a Web Audio gain instead (src/scripts/audio-level.js). */
export const applyMediaVolume = (el: HTMLMediaElement, level: number, muted: boolean) => audioBridge().apply(el, level, muted);

/** Same, at the shared session level. */
export const applySessionVolume = (el: HTMLMediaElement, muted: boolean) => applyMediaVolume(el, getVolume(), muted);

/** Current level (0–1), re-rendering the caller when it changes. */
export function useVolume(): number {
  const store = volumeStore();
  return useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), [store]),
    () => store.get(),
    () => DEFAULT_VOLUME,
  );
}
