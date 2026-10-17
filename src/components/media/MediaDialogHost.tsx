// Single React host for every dialog. It registers with the inline bootstrap and renders into the
// existing static shell via portals, so the modal opened before hydration is the same element React
// controls afterwards (no second modal, no remount flash). Hydrated with client:load.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { dfl, type DialogHost, type DialogRequest } from '../../lib/dialog';
import VideoLightbox from './VideoLightbox';
import ImageLightbox from './ImageLightbox';

const loadQuickCall = () => import('../interactive/QuickCallForm');
const QuickCallForm = lazy(loadQuickCall);

export default function MediaDialogHost() {
  const [req, setReq] = useState<DialogRequest | null>(null);
  const slots = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      controls: document.getElementById('dfl-slot-controls'),
      nav: document.getElementById('dfl-slot-nav'),
      counter: document.getElementById('dfl-slot-counter'),
      form: document.getElementById('dfl-slot-form'),
    };
  }, []);

  useEffect(() => {
    const host: DialogHost = { show: (r) => setReq(r), hide: () => setReq(null) };
    dfl()?.register(host);
    // Warm the Quick Call chunk when the browser is idle so the first open is instant.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const t = idle ? idle(() => void loadQuickCall()) : window.setTimeout(() => void loadQuickCall(), 1500);
    return () => {
      dfl()?.unregister(host);
      if (!idle) window.clearTimeout(t);
    };
  }, []);

  if (!slots || !req) return null;
  if (req.kind === 'quickcall') {
    return slots.form
      ? createPortal(
          <Suspense fallback={null}>
            <QuickCallForm />
          </Suspense>,
          slots.form,
        )
      : null;
  }
  return req.kind === 'video' ? <VideoLightbox req={req} slots={slots} /> : <ImageLightbox req={req} slots={slots} />;
}
