// Community waitlist card (owner, 2026-11-07). The counter starts at 48 for FOMO; only real
// signups are stored in D1. The owner gets one email per signup and sends the welcome mail manually.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CurvedInput from '../react-bits/CurvedInput';
import { interpolate } from '../../lib/interpolate';
import { WAITLIST_BASELINE, WAITLIST_GOAL, isValidEmail, normalizeEmail } from '../../lib/waitlist';
import type { Content } from '../../i18n';
import type { Locale } from '../../i18n/config';
import './Waitlist.css';

const TurnstileBox = lazy(() => import('./TurnstileBox'));

type Copy = Content['waitlist'];
type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'invalid' | 'rate' | 'full' | 'captcha' | 'error';

interface Props {
  locale: Locale;
  copy: Copy;
  privacyHref: string;
}

const ENDPOINT = '/api/waitlist';
const SITE_KEY: string | undefined = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || undefined;

export default function Waitlist({ locale, copy, privacyHref }: Props) {
  const [count, setCount] = useState(WAITLIST_BASELINE);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [captchaDown, setCaptchaDown] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const busy = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // At ≤380px the envelope chip + long labels squeeze the placeholder off the curve; drop the chip
  // and use one size smaller so the example address stays readable on a 320px phone.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 380px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.ok && typeof data.count === 'number') {
          setCount(Math.min(WAITLIST_GOAL, Math.max(WAITLIST_BASELINE, data.count)));
        }
      })
      .catch(() => {
        /* keep the 48 head start */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Success popup: lock the page, close on Escape/backdrop, and put focus on the close button.
  useEffect(() => {
    if (!popupOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopupOpen(false);
    };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [popupOpen]);

  const full = count >= WAITLIST_GOAL;
  const remaining = Math.max(0, WAITLIST_GOAL - count);
  const done = status === 'success' || full;

  const change = (next: string) => {
    setEmail(next);
    // Clear a previous duplicate/invalid/rate/error note as soon as the visitor edits the address.
    if (status === 'duplicate' || status === 'invalid' || status === 'rate' || status === 'captcha' || status === 'error') {
      setStatus('idle');
      setError(null);
    }
  };

  const submit = async (raw: string) => {
    if (busy.current || full) return;
    const value = normalizeEmail(raw);
    if (!isValidEmail(value)) {
      setStatus('invalid');
      setError(copy.invalid);
      return;
    }
    if (SITE_KEY && !token && !captchaDown) {
      setStatus('captcha');
      setError(copy.captcha);
      return;
    }
    busy.current = true;
    setStatus('submitting');
    setError(null);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 15_000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          consent: true,
          locale,
          website: '',
          turnstileToken: captchaDown ? undefined : token ?? undefined,
        }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        const next = typeof data.count === 'number' ? data.count : count + 1;
        setCount(Math.min(WAITLIST_GOAL, Math.max(WAITLIST_BASELINE, next)));
        if (data.duplicate) {
          setStatus('duplicate');
          setEmail('');
        } else {
          setPosition(typeof data.position === 'number' ? data.position : next);
          setStatus('success');
          setEmail('');
          setPopupOpen(true);
        }
        return;
      }
      if (res.status === 403) {
        setStatus('captcha');
        setError(copy.captcha);
        setToken(null);
        setCaptchaReset((n) => n + 1);
        return;
      }
      if (res.status === 409) {
        setCount(WAITLIST_GOAL);
        setStatus('full');
        return;
      }
      if (res.status === 400) {
        setStatus('invalid');
        setError(copy.invalid);
        return;
      }
      if (res.status === 429) {
        setStatus('rate');
        setError(copy.rate);
        return;
      }
      setStatus('error');
      setError(copy.error);
    } catch {
      setStatus('error');
      setError(copy.error);
    } finally {
      window.clearTimeout(timer);
      busy.current = false;
    }
  };

  return (
    <section className="wl" aria-labelledby="wl-title">
      <div className="wl__card">
        <div className="wl__copy">
          <p className="wl__eyebrow">{copy.eyebrow}</p>
          <h2 className="wl__title" id="wl-title">
            {copy.title}
          </h2>
          <p className="wl__lead">{copy.lead}</p>

          <div className="wl__meter">
            <div className="wl__meter-head">
              <span className="wl__count">
                <strong>{count}</strong>
                <span>/{WAITLIST_GOAL}</span>
              </span>
              <span className="wl__remaining">{full ? copy.full : interpolate(copy.remaining, { count: remaining })}</span>
            </div>
            <div
              className="wl__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={WAITLIST_GOAL}
              aria-valuenow={count}
              aria-label={interpolate(copy.countLabel, { count, goal: WAITLIST_GOAL })}
            >
              <span className="wl__bar-fill" style={{ width: `${(count / WAITLIST_GOAL) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="wl__action">
          {done ? (
            <div className="wl__done" role="status">
              <span className="wl__check" aria-hidden="true">
                ✓
              </span>
              <p>{status === 'success' ? interpolate(copy.success, { position: position ?? count }) : copy.full}</p>
            </div>
          ) : (
            <>
              <div className="wl__input">
                <CurvedInput
                  value={email}
                  onChange={change}
                  onSubmit={submit}
                  placeholder={copy.placeholder}
                  buttonText={copy.cta}
                  type="email"
                  name="email"
                  ariaLabel={copy.emailLabel}
                  theme="dark"
                  width={520}
                  bend={0}
                  height={64}
                  cornerRadius={20}
                  borderWidth={1}
                  fontSize={narrow ? 13.5 : 15}
                  showIcon={!narrow}
                  backgroundColor="#0f1a2b"
                  textColor="#f5f5f5"
                  placeholderColor="#8fb6d9"
                  borderColor="rgba(108, 184, 240, 0.3)"
                  buttonColor="#6cb8f0"
                  buttonTextColor="#08111f"
                  iconColor="#1f6feb"
                  icon={null}
                  shadowSize="lg"
                  shadowColor="#000000"
                  style={{}}
                />
              </div>

              <p className="wl__consent">
                {copy.consent} <a href={privacyHref}>{copy.privacyLink}</a>.
              </p>

              {SITE_KEY && !captchaDown && (
                <div className="wl__captcha">
                  <Suspense fallback={null}>
                    <TurnstileBox
                      siteKey={SITE_KEY}
                      resetKey={captchaReset}
                      language={locale}
                      appearance="always"
                      size="flexible"
                      onToken={setToken}
                      onUnavailable={() => setCaptchaDown(true)}
                    />
                  </Suspense>
                </div>
              )}

              <div className="wl__status" role="status" aria-live="polite">
                {status === 'duplicate' && <p className="wl__msg">{copy.duplicate}</p>}
                {status === 'submitting' && <p className="wl__msg wl__msg--muted">{copy.sending}</p>}
                {error && status !== 'duplicate' && <p className="wl__msg wl__msg--error">{error}</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {popupOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="wl-modal"
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) setPopupOpen(false);
            }}
          >
            <div className="wl-modal__panel" role="dialog" aria-modal="true" aria-labelledby="wl-success-title">
              <span className="wl-modal__icon" aria-hidden="true">
                ✓
              </span>
              <h2 className="wl-modal__title" id="wl-success-title">
                {copy.successTitle}
              </h2>
              <p className="wl-modal__body">{interpolate(copy.successBody, { position: position ?? count })}</p>
              <p className="wl-modal__meta">{full ? copy.full : interpolate(copy.successRemaining, { count: remaining })}</p>
              <button ref={closeRef} type="button" className="wl-modal__close" onClick={() => setPopupOpen(false)}>
                {copy.close}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
