/*
 * Drafty Lab V2 — session volume store (inlined by BaseLayout, runs before any island hydrates).
 *
 * One level for every video on the page: hover/inline previews, the Social front slides and the
 * lightbox all read from here, so the level chosen in the in-place volume gauge (VolumeOverlay,
 * touch devices) applies to the videos below. Session-only on purpose — no storage, a reload
 * starts again at DEFAULT (see docs/decisions-log.md, 17/10).
 */
(() => {
  if (window.__dflVolume) return;
  const DEFAULT = 0.5;
  let level = DEFAULT;
  const subs = new Set();
  window.__dflVolume = {
    DEFAULT,
    get: () => level,
    set: (v) => {
      const next = Math.min(1, Math.max(0, Number(v) || 0));
      if (next === level) return level;
      level = next;
      subs.forEach((fn) => {
        try {
          fn(level);
        } catch (_) {
          /* a broken subscriber must never block the others */
        }
      });
      return level;
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
})();
