// Cloudflare Turnstile widget (explicit render). Loaded lazily, only when a site key is configured and the visitor
// reaches the contact step. The token is verified SERVER-SIDE by /api/lead; the widget never blocks the form when
// the key is absent (local/dev). https://developers.cloudflare.com/turnstile/
import { useEffect, useRef } from 'react';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<void> | null = null;
const load = () =>
  (loader ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  }));

interface Props {
  siteKey: string;
  /** bump to force a fresh challenge (after a failed submit) */
  resetKey: number;
  /** Turnstile's own widget language, from the locale registry */
  language: string;
  onToken: (token: string | null) => void;
  onUnavailable: () => void;
}

export default function TurnstileBox({ siteKey, resetKey, language, onToken, onUnavailable }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef({ onToken, onUnavailable });
  cb.current = { onToken, onUnavailable };

  useEffect(() => {
    let dead = false;
    load()
      .then(() => {
        if (dead || !host.current || !window.turnstile) return;
        widget.current = window.turnstile.render(host.current, {
          sitekey: siteKey,
          theme: 'dark',
          language,
          callback: (t: string) => cb.current.onToken(t),
          'expired-callback': () => cb.current.onToken(null),
          'error-callback': () => cb.current.onToken(null),
        });
      })
      .catch(() => cb.current.onUnavailable());
    return () => {
      dead = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widget.current && window.turnstile) {
      cb.current.onToken(null);
      window.turnstile.reset(widget.current);
    }
  }, [resetKey]);

  return <div ref={host} className="qc-turnstile" />;
}
