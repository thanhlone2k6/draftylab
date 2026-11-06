'use client';

import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CUSTOM_SKILL } from '../../data/custom-skill';
import { getContent } from '../../i18n';
import { privacyPath, type Locale } from '../../i18n/config';
import { LIMITS, clean, isValidContact } from '../../lib/lead-schema';
import type { ContactMethod as Method } from '../../data/lead-options';

const TurnstileBox = lazy(() => import('./TurnstileBox'));

type Status = 'idle' | 'submitting' | 'demo' | 'success' | 'error' | 'invalid' | 'rate' | 'captcha' | 'disabled';

interface Props { locale: Locale }

const ENDPOINT: string | undefined = import.meta.env.PUBLIC_LEAD_ENDPOINT || undefined;
const SITE_KEY: string | undefined = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || undefined;

const newRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 3) | 8).toString(16);
      });

export default function CustomSkillContactForm({ locale }: Props) {
  const f = CUSTOM_SKILL[locale].form;
  const c = getContent(locale);
  const q = c.quickCall;
  const uid = useId();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [captchaDown, setCaptchaDown] = useState(false);
  const [touched, setTouched] = useState({ name: false, contact: false, consent: false });
  const [status, setStatus] = useState<Status>('idle');
  const busy = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const requestId = useRef(newRequestId());

  const method: Method = isValidContact('email', value)
    ? 'email'
    : isValidContact('phone', value)
      ? 'phone'
      : isValidContact('instagram', value)
        ? 'instagram'
        : 'other';
  const nameOk = clean(name).length >= LIMITS.nameMin && clean(name).length <= LIMITS.nameMax;
  const valueOk = clean(value).length >= 2 && clean(value).length <= LIMITS.contactMax;
  const needsCaptcha = !!(ENDPOINT && SITE_KEY);
  const captchaOk = !needsCaptcha || !!token;
  const valid = useMemo(() => nameOk && valueOk && captchaOk && agreed, [nameOk, valueOk, captchaOk, agreed]);

  useEffect(() => {
    nameInput.current?.focus({ preventScroll: true });
  }, []);

  const submit = async () => {
    if (busy.current) return;
    if (!valid) {
      setTouched({ name: true, contact: true, consent: true });
      return;
    }
    if (!ENDPOINT) {
      setStatus('demo');
      return;
    }
    busy.current = true;
    setStatus('submitting');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The offer is a Custom Skill request, not the four-step Quick Call. The server uses
          // `source` for the email label; the sentinel values satisfy the shared lead whitelist.
          source: 'custom-skill',
          industry: 'Khác',
          needs: ['Branding / AI Creative'],
          team: 'Tự làm',
          budget: '',
          name: clean(name),
          method,
          contact: clean(value),
          note: clean(note, true),
          consent: agreed,
          requestId: requestId.current,
          turnstileToken: token ?? undefined,
        }),
        signal: ctrl.signal,
      });
      if (res.ok) {
        setStatus('success');
        return;
      }
      setStatus(res.status === 400 ? 'invalid' : res.status === 429 ? 'rate' : res.status === 403 ? 'captcha' : res.status === 503 ? 'disabled' : 'error');
      if (res.status === 403) {
        setToken(null);
        setCaptchaReset((n) => n + 1);
      }
    } catch {
      setStatus('error');
    } finally {
      clearTimeout(timer);
      busy.current = false;
    }
  };

  return (
    <div className="qc csf">
      <header className="qc__head">
        <p className="qc__sub">{f.lead}</p>
      </header>

      {status === 'success' ? (
        <div className="qc-result qc-result--ok" role="status">
          <h3>{f.successTitle}</h3>
          <p>{f.successBody}</p>
        </div>
      ) : (
        <form
          className="qc-step qc-contact"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="qc-field">
            <label htmlFor={`${uid}-name`}>{f.name}</label>
            <input
              ref={nameInput}
              id={`${uid}-name`}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.nameMax * 2}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={touched.name && !nameOk}
              aria-describedby={touched.name && !nameOk ? `${uid}-name-err` : undefined}
            />
            {touched.name && !nameOk && <span id={`${uid}-name-err`} className="qc-err">{q.steps.contact.nameError}</span>}
          </div>

          <div className="qc-field">
            <label htmlFor={`${uid}-contact`}>{f.contact}</label>
            <input
              id={`${uid}-contact`}
              type="text"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
              aria-invalid={touched.contact && !valueOk}
              aria-describedby={touched.contact && !valueOk ? `${uid}-contact-err` : undefined}
            />
            {touched.contact && !valueOk && <span id={`${uid}-contact-err`} className="qc-err">{q.steps.contact.valueError}</span>}
          </div>

          <div className="qc-field">
            <label htmlFor={`${uid}-note`}>{f.note}</label>
            <textarea id={`${uid}-note`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.noteMax} />
          </div>

          <div className="qc-consent">
            <input
              id={`${uid}-consent`}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              onBlur={() => setTouched((t) => ({ ...t, consent: true }))}
              aria-required="true"
              aria-invalid={touched.consent && !agreed}
              aria-describedby={touched.consent && !agreed ? `${uid}-consent-err` : undefined}
            />
            <label htmlFor={`${uid}-consent`}>
              {q.consentLabel}{' '}
              <a href={privacyPath(locale)} target="_blank" rel="noopener noreferrer">
                {q.privacyLink}
              </a>
              .
            </label>
          </div>
          {touched.consent && !agreed && (
            <span id={`${uid}-consent-err`} className="qc-err">{q.consentError}</span>
          )}

          {needsCaptcha && !captchaDown && (
            <Suspense fallback={null}>
              <TurnstileBox siteKey={SITE_KEY!} resetKey={captchaReset} onToken={setToken} onUnavailable={() => setCaptchaDown(true)} language={q.turnstileLang} />
            </Suspense>
          )}
          {needsCaptcha && captchaDown && <p className="qc-err" role="alert">{q.captchaFailed}</p>}

          <button type="submit" className="csf__submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? f.sending : f.submit}
          </button>

          {status === 'demo' && (
            <div className="qc-result qc-result--demo" role="alert">
              <p>{q.demoResult}</p>
              <p><a href={`mailto:${c.contact.email}`}>{c.contact.email}</a></p>
            </div>
          )}
          {status !== 'idle' && status !== 'submitting' && status !== 'demo' && (
            <div className="qc-result qc-result--err" role="alert">
              <p>{status === 'invalid' ? q.invalidResult : status === 'rate' ? q.rateLimited : status === 'captcha' ? q.captchaFailed : status === 'disabled' ? q.disabledResult : f.error}</p>
              {(status === 'error' || status === 'captcha' || status === 'invalid') && (
                <button type="button" className="csf__retry" onClick={() => void submit()} disabled={status === 'captcha' && needsCaptcha && !token}>
                  {q.retry}
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
