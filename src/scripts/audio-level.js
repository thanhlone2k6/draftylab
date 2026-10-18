/*
 * Drafty Lab V2 — audio-level bridge (inlined by BaseLayout, runs before any island hydrates).
 *
 * Why this exists: iOS Safari does not honour `video.volume = x` — the property is read-only there and
 * always reads 1 (Apple, "Safari HTML5 Audio and Video Guide" → iOS-specific considerations). So on an
 * iPhone the level picked in the in-place gauge (VolumeOverlay) reached the element and the session store,
 * but the sound never changed: "điều chỉnh âm thanh ở mobile thì không áp dụng gì cả" (owner, 2026-10-19).
 *
 * Where the browser honours `volume` (every desktop browser, Android Chrome) nothing changes here: the
 * plain element path is kept, byte for byte. Where it does not, the element's audio is re-routed through a
 * Web Audio GainNode (the documented workaround — `createMediaElementSource`, WebKit bug 237322) and the
 * gain carries the level instead.
 *
 * Two iOS details this bridge has to get right:
 *  • Audio routed into an AudioContext defaults to the `ambient` session type, which the ringer/silent
 *    switch mutes — routed audio would go silent where a bare `<video>` was audible. We ask for
 *    `navigator.audioSession.type = 'playback'` (Safari 16.4+) so the level stays audible with the
 *    switch on. Without the API (very old iOS) the gauge still works, it just follows the silent switch.
 *  • An AudioContext may only start inside a real gesture. Routing is therefore deferred: a muted element
 *    is never routed (it is silent anyway) and an unmuted one waits for the first pointer/key gesture, so
 *    we never re-route a playing element into a suspended context (which would be silent).
 */
(() => {
  if (window.__dflAudio) return;

  // Does `element.volume = x` really change the loudness? False on iOS Safari (it stays 1).
  const SETTABLE = (() => {
    try {
      const probe = document.createElement('video');
      probe.volume = 0.5;
      return Math.abs(probe.volume - 0.5) < 0.01;
    } catch (_) {
      return true;
    }
  })();

  if (SETTABLE) {
    // Desktop / Android: the element property works — no AudioContext, no behaviour change.
    window.__dflAudio = {
      settable: true,
      apply: (el, level, muted) => {
        el.volume = Math.min(1, Math.max(0, Number(level) || 0));
        el.muted = !!muted;
      },
      resume: () => {},
    };
    return;
  }

  const routed = new WeakMap(); // element -> { gain, level } (gain null = Web Audio refused, native path)
  const pending = new Map(); // element -> wanted level, waiting for the first gesture
  let context = null;
  let gestured = false;

  const audioContext = () => {
    if (context) return context;
    // `webkitAudioContext` is the pre-Safari-14 spelling; the JSDoc cast keeps `astro check` quiet.
    const win = /** @type {{ AudioContext?: typeof AudioContext, webkitAudioContext?: typeof AudioContext }} */ (window);
    const Ctor = win.AudioContext || win.webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch (_) {
      return null;
    }
    try {
      // Playback routing: without this iOS mutes the routed audio with the ringer switch.
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (_) {
      /* the API is optional */
    }
    return context;
  };

  const resume = () => {
    if (context && context.state === 'suspended') context.resume().catch(() => {});
  };

  /** Re-route an element's audio through a gain, once. Must be called inside a gesture. */
  const route = (el, level) => {
    const known = routed.get(el);
    if (known) return known;
    const ctx = audioContext();
    if (!ctx) return null;
    let entry = { gain: null, level };
    try {
      const gain = ctx.createGain();
      ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
      gain.gain.value = el.muted ? 0 : level;
      // The element drives the graph through its own volume/mute stage, so the element stays at full scale
      // and the gain is the only level. A later change to `muted` (the lightbox's own toggle, native
      // controls) has to move the gain too — `volumechange` is the one event that covers all of them.
      el.addEventListener('volumechange', () => {
        const now = routed.get(el);
        if (now && now.gain) now.gain.gain.value = el.muted ? 0 : now.level;
      });
      entry = { gain, level };
    } catch (_) {
      entry = { gain: null, level }; // already routed elsewhere / refused: stay on the native path
    }
    routed.set(el, entry);
    return entry;
  };

  /**
   * The one call the rest of the page uses: put a media element at `level` (0–1) with its mute state.
   * Muted elements are left on the native path (silent either way); the rest are routed on the first gesture.
   */
  const apply = (el, level, muted) => {
    const v = Math.min(1, Math.max(0, Number(level) || 0));
    const known = routed.get(el);

    if (known) {
      known.level = v;
      if (known.gain) {
        known.gain.gain.value = muted ? 0 : v;
        el.volume = 1; // never attenuate twice; iOS pins this at 1 regardless
        el.muted = !!muted;
        resume();
        return;
      }
    }

    if (muted) {
      pending.delete(el);
      el.volume = v;
      el.muted = true;
      return;
    }
    if (!gestured) {
      // An unmuted element but no user gesture yet: remember the level, pick it up on the first gesture.
      pending.set(el, v);
      el.volume = v;
      el.muted = false;
      return;
    }
    pending.delete(el);
    const entry = route(el, v);
    if (!entry || !entry.gain) {
      el.volume = v; // no Web Audio available: nothing more this bridge can do
      el.muted = false;
      return;
    }
    entry.level = v;
    entry.gain.gain.value = v;
    el.volume = 1;
    el.muted = false;
    resume();
  };

  const onGesture = () => {
    gestured = true;
    resume();
    if (!pending.size) return;
    const queued = [...pending];
    pending.clear();
    queued.forEach(([el, level]) => apply(el, level, false));
  };

  document.addEventListener('pointerdown', onGesture, true);
  document.addEventListener('keydown', onGesture, true);
  document.addEventListener('touchstart', onGesture, true);

  window.__dflAudio = { settable: false, apply, resume };
})();
