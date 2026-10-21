'use client';
// Language switcher (owner, 2026-10-19): a compact glass pill at the TOP-RIGHT of the header that drops
// down the five languages — every row is just its flag emoji + two-letter code, with NO panel box, only
// a soft shadow so the letters stay readable over the page.
//
// Picking a language navigates to that locale's route (`/` for Vietnamese, `/<code>/` for the rest), so
// the switcher IS the i18n entry point — see src/i18n/*.
import { useCallback, useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_META, localePath, type Locale } from '../../i18n/config';
import { getContent } from '../../i18n';

interface Props { locale: Locale }

export default function LangSwitcher({ locale }: Props) {
  const c = getContent(locale);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const current = LOCALE_META[locale];

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus({ preventScroll: true });
  }, []);

  // Outside pointer / Escape close the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      close();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Move focus to the current language as soon as the menu opens.
  useEffect(() => {
    if (!open) return;
    const sel = list.current?.querySelector<HTMLAnchorElement>('[aria-current="true"]');
    (sel ?? list.current?.querySelector<HTMLAnchorElement>('a'))?.focus({ preventScroll: true });
  }, [open]);

  // Roving focus inside the list.
  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLAnchorElement);
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length].focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Tab') close(false);
  };

  return (
    <div className="lsw" ref={root} data-open={open ? '' : undefined}>
      <button
        ref={btn}
        type="button"
        className="lsw__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${c.languages.label}: ${current.name}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="lsw__flag" aria-hidden="true">{current.flag}</span>
        <span className="lsw__code">{current.short}</span>
      </button>

      {open && (
        <ul className="lsw__menu" role="listbox" aria-label={c.languages.label} ref={list} onKeyDown={onListKey}>
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const active = code === locale;
            return (
              <li key={code} role="none">
                <a
                  className="lsw__opt"
                  role="option"
                  aria-selected={active}
                  aria-current={active ? 'true' : undefined}
                  href={localePath(code)}
                  hrefLang={meta.htmlLang}
                  onClick={() => {
                    // 2026-10-21 (owner): keep the reader's place across the language switch — this is a
                    // plain MPA navigation, so the browser would land at the top. Remember scrollY here and
                    // let the inline script in BaseLayout restore it on the destination page.
                    try { sessionStorage.setItem('dfl-lang-scroll', String(window.scrollY || 0)); } catch { /* private mode */ }
                    setOpen(false);
                  }}
                >
                  <span className="lsw__flag" aria-hidden="true">{meta.flag}</span>
                  <span className="lsw__code">{meta.short}</span>
                  <span className="sr-only">{meta.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
