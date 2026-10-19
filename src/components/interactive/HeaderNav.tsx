'use client';
// Site header — React Bits **PillNav** with the owner's preset (Split layout, Plain items, Glide hover,
// Pill indicator, Glass surface, Medium size, Auto collapse, bounce 0.56, intro on). Wired to the page:
//  • scroll-spy keeps the pill indicator on the section in view (same 40% line as the old header);
//  • the logo (owner-supplied mark at /media/brand/logo.png) links back to #top and spins on hover;
//  • real links are plain hash anchors; the "Let's Talk" item has NO href so PillNav renders it as a
//    button, which opens the Quick Call dialog (and closes the folded menu itself).
import { useCallback, useEffect, useRef, useState } from 'react';
import PillNav from '../react-bits/PillNav';
import { dfl } from '../../lib/dialog';
import { getContent } from '../../i18n';
import type { Locale } from '../../i18n/config';

interface Props { locale: Locale }

export default function HeaderNav({ locale }: Props) {
  const c = getContent(locale);
  const nav = c.nav;
  const LINKS = nav.links;
  // Starts empty (no section is in view at the top of the page), so the pill does not flash on "Work"
  // before the first scroll-spy pass.
  const [activeHref, setActiveHref] = useState('');
  const raf = useRef(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
    const linked = new Set(LINKS.map((l) => l.href));
    const spy = () => {
      raf.current = 0;
      const line = window.innerHeight * 0.4;
      let current = '';
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = `#${s.id}`;
      // A section with no link clears the indicator instead of leaving a stale one.
      const next = linked.has(current) ? current : '';
      setActiveHref((prev) => (prev === next ? prev : next));
    };
    spy();
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(spy);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', spy);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', spy);
    };
  }, []);

  const onItemClick = useCallback((item: { href?: string }) => {
    if (item.href) return; // real links navigate on their own
    dfl()?.open({ kind: 'quickcall' }, document.activeElement instanceof Element ? document.activeElement : null);
  }, []);

  return (
    <div className="hnav">
      <PillNav
        logo="/media/brand/logo.png"
        logoAlt={nav.logoAria}
        logoHref="#top"
        items={[...LINKS, { label: nav.cta, ariaLabel: nav.cta }]}
        activeHref={activeHref}
        layout="split"
        itemStyle="plain"
        hoverEffect="glide"
        indicator="pill"
        surface="glass"
        size="md"
        collapse="auto"
        bounce={0.56}
        intro
        ariaLabel={nav.ariaLabel}
        menuOpenLabel={nav.menuToggleAria.open}
        menuCloseLabel={nav.menuToggleAria.close}
        onItemClick={onItemClick}
      />
    </div>
  );
}
