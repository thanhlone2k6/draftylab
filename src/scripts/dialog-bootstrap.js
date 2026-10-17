/*
 * Drafty Lab V2 — dialog bootstrap (inlined in <head>-less body end by BaseLayout, runs before hydration).
 *
 * One static dialog shell (#dfl-dialog) serves every modal: video, image, Quick Call.
 *  • Click on any [data-dfl-open] opens the shell IMMEDIATELY — no waiting for React.
 *  • Video/image sources are assigned synchronously inside the click (user gesture), so iPhone
 *    Safari allows playback with sound; nothing is requested before the click.
 *  • When the React host (MediaDialogHost, client:load) registers, it renders controls/form INTO
 *    the same shell (portals) — no second modal, no remount, no flash.
 *  • Close/Escape/backdrop/focus-trap/scroll-lock/focus-restore live here, so the dialog can
 *    always be closed even if React fails to load. After FALLBACK_MS without a host, native
 *    video controls + an error/contact message are shown.
 * Video playback logic ported from V1 Work.astro openLightbox()/closeLightbox() (see docs/v1-media-audit.md).
 */
(() => {
  if (window.__dfl) return;
  const shell = document.getElementById('dfl-dialog');
  if (!shell) return;
  const panel = shell.querySelector('.dlg__panel');
  const titleEl = shell.querySelector('#dfl-dialog-title');
  const video = shell.querySelector('#dfl-video');
  const image = shell.querySelector('#dfl-image');
  const errorEl = shell.querySelector('[data-dfl-error]');
  const closeBtn = shell.querySelector('.dlg__close');
  const FALLBACK_MS = 8000;
  // Session volume (src/scripts/volume-store.js): every video on the page shares one level (the lightbox
  // used to hard-code 0.8). Falls back to 50% if the store is missing.
  const level = () => (window.__dflVolume && window.__dflVolume.get()) || 0.5;
  // Hover-capable devices keep the V1 behaviour (click anywhere on a card opens the lightbox); touch
  // devices play the preview in place and use the card's ⤢ button to open it (docs/decisions-log.md).
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const d = { host: null, req: null, trigger: null, timer: 0 };
  window.__dfl = d;

  const readReq = (el) => {
    const ds = el.dataset;
    if (ds.dflOpen === 'quickcall') return { kind: 'quickcall' };
    return {
      kind: ds.dflOpen,
      id: ds.mediaId || '',
      group: ds.group || '',
      title: ds.title || '',
      poster: ds.poster || '',
      aspect: Number(ds.aspect) || 0,
      src: ds.videoSrc || ds.fullSrc || '',
      pending: el.hasAttribute('data-video-pending'),
    };
  };

  const lock = () => {
    // Lets CSS stop painting heavy decorative layers (hero WebGL) while the modal covers the page.
    document.documentElement.setAttribute('data-dialog-open', '');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };
  const unlock = () => {
    document.documentElement.removeAttribute('data-dialog-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };

  const setAspect = (ar) => {
    const v = ar > 0 ? ar : 9 / 16;
    shell.style.setProperty('--dlg-ar', String(v));
    shell.toggleAttribute('data-portrait', v < 1);
  };

  // V1: pause + detach src + load() so the network request and audio stop for real.
  const stopVideo = () => {
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.removeAttribute('poster');
    video.controls = false;
    shell.removeAttribute('data-playing');
    shell.removeAttribute('data-muted-fallback');
  };

  const loadMedia = (req) => {
    stopVideo();
    image.removeAttribute('src');
    image.alt = '';
    setAspect(req.aspect);
    titleEl.textContent = req.title || '';
    shell.toggleAttribute('data-pending', !!req.pending);
    if (req.kind === 'video' && !req.pending && req.src) {
      if (req.poster) video.poster = req.poster;
      video.src = req.src;
      video.muted = false;
      video.volume = level();
      if (!d.host && shell.hasAttribute('data-failed')) video.controls = true;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        // V1: Safari may reject unmuted playback → one muted retry; the UI offers "bật tiếng".
        p.catch(() => {
          // Only retry if this same video is still the one on screen (not closed / not switched).
          if (shell.hidden || video.getAttribute('src') !== req.src) return;
          video.muted = true;
          shell.setAttribute('data-muted-fallback', '');
          video.play().catch(() => {});
        });
      }
    } else if (req.poster || req.src) {
      image.src = req.kind === 'image' ? req.src || req.poster : req.poster;
      image.alt = req.title || '';
    }
  };

  const fail = () => {
    if (d.host || shell.hidden) return;
    shell.setAttribute('data-failed', '');
    errorEl.hidden = false;
    if (video.getAttribute('src')) video.controls = true;
  };

  const open = (req, trigger) => {
    const wasOpen = !shell.hidden;
    if (!wasOpen) {
      d.trigger = trigger || document.activeElement;
      lock();
    }
    d.req = req;
    shell.dataset.variant = req.kind;
    errorEl.hidden = !shell.hasAttribute('data-failed');
    if (req.kind === 'quickcall') {
      stopVideo();
      image.removeAttribute('src');
      shell.removeAttribute('data-pending');
      titleEl.textContent = shell.dataset.quickcallTitle || 'Quick Call';
    } else {
      loadMedia(req);
    }
    if (!wasOpen) {
      shell.hidden = false;
      closeBtn.focus({ preventScroll: true });
    }
    if (d.host) d.host.show(req);
    else {
      clearTimeout(d.timer);
      d.timer = setTimeout(fail, FALLBACK_MS);
    }
  };

  const close = () => {
    if (shell.hidden) return;
    clearTimeout(d.timer);
    try {
      if (d.host) d.host.hide();
    } catch (_) {
      /* host errors must never block closing */
    }
    stopVideo();
    image.removeAttribute('src');
    shell.hidden = true;
    shell.removeAttribute('data-pending');
    shell.removeAttribute('data-failed');
    errorEl.hidden = true;
    delete shell.dataset.variant;
    unlock();
    d.req = null;
    const t = d.trigger;
    d.trigger = null;
    if (t && document.contains(t) && typeof t.focus === 'function') t.focus({ preventScroll: true });
  };

  d.open = open;
  d.close = close;
  d.isOpen = () => !shell.hidden;
  d.register = (host) => {
    d.host = host;
    clearTimeout(d.timer);
    shell.setAttribute('data-host', '');
    shell.removeAttribute('data-failed');
    errorEl.hidden = true;
    if (video.getAttribute('src')) video.controls = false;
    if (!shell.hidden && d.req) host.show(d.req);
  };
  d.unregister = (host) => {
    if (d.host === host) {
      d.host = null;
      shell.removeAttribute('data-host');
    }
  };

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), video[controls]';
  const trap = (e) => {
    const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) =>
        !el.closest('[hidden], [aria-hidden="true"], [inert]') &&
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== 'hidden',
    );
    if (!items.length) {
      e.preventDefault();
      return;
    }
    // Manage Tab ourselves: engines differ on whether buttons are tab stops (Safari skips them by default),
    // so cycling explicitly keeps focus inside the dialog everywhere.
    e.preventDefault();
    const idx = items.indexOf(document.activeElement);
    const step = e.shiftKey ? -1 : 1;
    const next = idx === -1 ? (e.shiftKey ? items.length - 1 : 0) : (idx + step + items.length) % items.length;
    items[next].focus();
  };

  // Delegated triggers — capture phase, so they work before any island hydrates.
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-dfl-open]') : null;
      if (!el || el.closest('#dfl-dialog')) return;
      // Video cards with preview-src play in place (volume gauge lives there too); only the ⤢ expand button opens the lightbox.
      if (el.hasAttribute('data-preview-src')) return;
      // Triggers rendered by a React island are handled by React once that island has hydrated.
      if (el.hasAttribute('data-dfl-prehydrate') && !el.closest('astro-island[ssr]')) return;
      e.preventDefault();
      open(readReq(el), el);
    },
    true,
  );

  shell.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-dfl-close]')) close();
  });
  // Without React: tapping the video toggles playback.
  video.addEventListener('click', () => {
    if (d.host) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', () => shell.setAttribute('data-playing', ''));
  video.addEventListener('pause', () => shell.removeAttribute('data-playing'));
  video.addEventListener('loadedmetadata', () => {
    // V1: drive the frame from the real video aspect once known.
    if (!shell.hidden && video.videoWidth > 0) setAspect(video.videoWidth / video.videoHeight);
  });

  document.addEventListener('keydown', (e) => {
    if (shell.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') trap(e);
  });
})();
