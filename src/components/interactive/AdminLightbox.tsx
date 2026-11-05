'use client';
// /admin overlay: the edit form and the 1:1 crop step open on top of the page instead of pushing it around.
// Two lightboxes can be open at once (crop above the edit form), so Escape closes only the top one and
// the page scroll lock is reference-counted instead of each overlay restoring its own snapshot.
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  label: string;
  onClose: () => void;
  /** 'crop' stacks above the edit form (which is itself a lightbox). */
  variant?: 'form' | 'crop';
  children: ReactNode;
}

const openStack: string[] = [];
let lockCount = 0;
let savedOverflow = '';

function lockScroll() {
  if (lockCount === 0) savedOverflow = document.body.style.overflow;
  lockCount += 1;
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = savedOverflow;
}

export default function AdminLightbox({ label, onClose, variant = 'form', children }: Props) {
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    openStack.push(id);
    lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openStack[openStack.length - 1] !== id) return; // only the topmost overlay reacts
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const at = openStack.lastIndexOf(id);
      if (at >= 0) openStack.splice(at, 1);
      unlockScroll();
    };
  }, [id]);

  return (
    <div className={`adm-lightbox${variant === 'crop' ? ' adm-lightbox--crop' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="adm-lightbox__panel">{children}</div>
    </div>
  );
}
