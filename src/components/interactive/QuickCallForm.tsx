// Quick Call in 10 Min — 4 steps, button-first. React Bits Stepper is only the step wrapper
// (progress, Back/Continue, transitions); state + validation live here.
// Without PUBLIC_LEAD_ENDPOINT the form runs in honest DEMO mode (says so, never pretends to succeed). With it, a
// request is POSTed to the Pages Function (/api/lead), which re-validates everything with the SAME shared schema,
// verifies Turnstile, rate-limits and stores the lead. "Success" is shown only after the server answers 200.
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import Stepper, { Step } from '../react-bits/Stepper';
import { quickCall as q, contact } from '../../data/content';
import { LIMITS, clean, isValidContact } from '../../lib/lead-schema';
import type { ContactMethod as Method } from '../../data/lead-options';

const TurnstileBox = lazy(() => import('./TurnstileBox'));

type Status = 'idle' | 'submitting' | 'demo' | 'success' | 'error' | 'invalid' | 'rate' | 'captcha' | 'disabled';

const ENDPOINT: string | undefined = import.meta.env.PUBLIC_LEAD_ENDPOINT || undefined;
const SITE_KEY: string | undefined = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || undefined;

const newRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 3) | 8).toString(16);
      });

function Choice({ label, selected, onSelect, multi }: { label: string; selected: boolean; onSelect: () => void; multi?: boolean }) {
  return (
    <button type="button" className="qc-choice" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} data-selected={selected ? '' : undefined} onClick={onSelect}>
      <span className="qc-choice__mark" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default function QuickCallForm() {
  const uid = useId();
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('');
  const [needs, setNeeds] = useState<string[]>([]);
  const [team, setTeam] = useState('');
  const [budget, setBudget] = useState(''); // optional
  const [name, setName] = useState('');
  const [method, setMethod] = useState<Method>('phone');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [captchaDown, setCaptchaDown] = useState(false);
  const [touched, setTouched] = useState({ name: false, value: false, consent: false });
  const [status, setStatus] = useState<Status>('idle');
  const busy = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(newRequestId()); // reused on retry → the server never stores a duplicate

  const methodDef = q.steps.contact.methods.find((m) => m.id === method)!;
  const nameOk = clean(name).length >= LIMITS.nameMin && clean(name).length <= LIMITS.nameMax;
  const valueOk = isValidContact(method, value);
  const needsCaptcha = !!(ENDPOINT && SITE_KEY);
  const captchaOk = !needsCaptcha || !!token;
  const stepValid = useMemo(
    () => ({ 1: !!industry, 2: needs.length > 0, 3: !!team, 4: nameOk && valueOk && consent && captchaOk }) as Record<number, boolean>,
    [industry, needs, team, nameOk, valueOk, consent, captchaOk],
  );

  const submit = async () => {
    if (busy.current) return; // no double submit
    if (!stepValid[4]) {
      setTouched({ name: true, value: true, consent: true });
      return;
    }
    if (website) return; // bot
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
          industry, needs, team, budget, name: clean(name), method, contact: clean(value), note: clean(note, true),
          consent, requestId: requestId.current, turnstileToken: token ?? undefined, website,
        }),
        signal: ctrl.signal,
      });
      if (res.ok) {
        setStatus('success');
        setStep(5);
        return;
      }
      setStatus(res.status === 400 ? 'invalid' : res.status === 429 ? 'rate' : res.status === 403 ? 'captcha' : res.status === 503 ? 'disabled' : 'error');
      if (res.status === 403) {
        setToken(null);
        setCaptchaReset((n) => n + 1);
      }
    } catch {
      setStatus('error'); // network / timeout — no PII is logged
    } finally {
      clearTimeout(timer);
      busy.current = false;
    }
  };

  // Make sure the honest demo/error message is on screen (the form scrolls inside the dialog on phones).
  useEffect(() => {
    if (status !== 'idle' && status !== 'submitting' && status !== 'success') resultRef.current?.scrollIntoView({ block: 'nearest' });
  }, [status]);

  const toggleNeed = (n: string) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  return (
    <div className="qc">
      <header className="qc__head">
        <p className="qc__sub">{q.subtitle}</p>
        {!ENDPOINT && (
          <p className="qc__demo" role="note">
            <strong>DEMO</strong> {q.demoBanner}
          </p>
        )}
      </header>

      <Stepper
        step={step}
        onStepChange={(s) => {
          setStep(s);
          if (status !== 'submitting' && status !== 'success') setStatus('idle');
        }}
        onFinalStepCompleted={submit}
        linear
        indicator="numbers"
        width="100%"
        frame
        theme="dark"
        accentColor="#c59c4a"
        backButtonText={q.back}
        nextButtonText={q.next}
        completeButtonText={status === 'submitting' ? q.sending : q.submit}
        nextButtonProps={{
          disabled: !stepValid[step] || status === 'submitting',
          'aria-disabled': !stepValid[step] || status === 'submitting',
          onClick: (e) => {
            if (step === 4 && !stepValid[4]) {
              e.preventDefault();
              setTouched({ name: true, value: true, consent: true });
            }
          },
        }}
        completedContent={
          <div className="qc-result qc-result--ok" role="status">
            <h3>{q.successTitle}</h3>
            <p>{q.successBody}</p>
          </div>
        }
      >
        <Step title={q.steps.industry.title}>
          <fieldset className="qc-step">
            <legend className="qc-q">{q.steps.industry.question}</legend>
            <div className="qc-choices" role="radiogroup">
              {q.steps.industry.options.map((o) => (
                <Choice key={o} label={o} selected={industry === o} onSelect={() => setIndustry(o)} />
              ))}
            </div>
          </fieldset>
        </Step>

        <Step title={q.steps.needs.title}>
          <fieldset className="qc-step">
            <legend className="qc-q">{q.steps.needs.question}</legend>
            <p className="qc-hint">{q.steps.needs.hint}</p>
            <div className="qc-choices">
              {q.steps.needs.options.map((o) => (
                <Choice key={o} label={o} multi selected={needs.includes(o)} onSelect={() => toggleNeed(o)} />
              ))}
            </div>
          </fieldset>
        </Step>

        <Step title={q.steps.team.title}>
          <fieldset className="qc-step">
            <legend className="qc-q">{q.steps.team.question}</legend>
            <div className="qc-choices" role="radiogroup">
              {q.steps.team.options.map((o) => (
                <Choice key={o} label={o} selected={team === o} onSelect={() => setTeam(o)} />
              ))}
            </div>
            <div className="qc-optional">
              <p className="qc-q qc-q--sub" id={`${uid}-budget`}>
                {q.steps.budget.question} <span className="qc-hint-inline">({q.steps.budget.hint})</span>
              </p>
              <div className="qc-choices" role="radiogroup" aria-labelledby={`${uid}-budget`}>
                {q.steps.budget.options.map((o) => (
                  // tap the selected option again to clear it — the question is optional
                  <Choice key={o} label={o} selected={budget === o} onSelect={() => setBudget((b) => (b === o ? '' : o))} />
                ))}
              </div>
            </div>
          </fieldset>
        </Step>

        <Step title={q.steps.contact.title}>
          <form
            className="qc-step qc-contact"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p className="qc-q">{q.steps.contact.question}</p>
            <div className="qc-field">
              <label htmlFor={`${uid}-name`}>{q.steps.contact.name}</label>
              <input
                id={`${uid}-name`}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={LIMITS.nameMax * 2}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                aria-invalid={touched.name && !nameOk}
                aria-describedby={touched.name && !nameOk ? `${uid}-name-err` : undefined}
                enterKeyHint="next"
              />
              {touched.name && !nameOk && <span id={`${uid}-name-err`} className="qc-err">{q.steps.contact.nameError}</span>}
            </div>

            <div className="qc-field">
              <span id={`${uid}-method`}>{q.steps.contact.method}</span>
              <div className="qc-seg" role="radiogroup" aria-labelledby={`${uid}-method`}>
                {q.steps.contact.methods.map((m) => (
                  <Choice
                    key={m.id}
                    label={m.label}
                    selected={method === m.id}
                    onSelect={() => {
                      setMethod(m.id as Method);
                      setTouched((t) => ({ ...t, value: false }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="qc-field">
              <label htmlFor={`${uid}-val`}>{methodDef.label}</label>
              <input
                id={`${uid}-val`}
                type={method === 'email' ? 'email' : method === 'phone' ? 'tel' : 'text'}
                inputMode={method === 'phone' ? 'tel' : method === 'email' ? 'email' : 'text'}
                autoComplete={method === 'email' ? 'email' : method === 'phone' ? 'tel' : 'off'}
                placeholder={methodDef.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, value: true }))}
                aria-invalid={touched.value && !valueOk}
                aria-describedby={touched.value && !valueOk ? `${uid}-val-err` : undefined}
                enterKeyHint="send"
              />
              {touched.value && !valueOk && <span id={`${uid}-val-err`} className="qc-err">{methodDef.error}</span>}
            </div>

            <div className="qc-field">
              <label htmlFor={`${uid}-note`}>{q.steps.contact.note}</label>
              <textarea id={`${uid}-note`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.noteMax} />
            </div>

            <div className="qc-consent">
              <label className="qc-consent__row">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  onBlur={() => setTouched((t) => ({ ...t, consent: true }))}
                  aria-invalid={touched.consent && !consent}
                  aria-describedby={`${uid}-privacy`}
                />
                <span>{q.steps.contact.consent}</span>
              </label>
              {touched.consent && !consent && <span className="qc-err">{q.steps.contact.consentError}</span>}
              <p id={`${uid}-privacy`} className="qc-privacy">{q.steps.contact.privacy}</p>
            </div>

            {needsCaptcha && !captchaDown && (
              <Suspense fallback={null}>
                <TurnstileBox siteKey={SITE_KEY!} resetKey={captchaReset} onToken={setToken} onUnavailable={() => setCaptchaDown(true)} />
              </Suspense>
            )}
            {needsCaptcha && captchaDown && <p className="qc-err" role="alert">{q.captchaFailed}</p>}

            {/* Honeypot: hidden from people and assistive tech. */}
            <input className="qc-hp" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            <button type="submit" hidden tabIndex={-1} aria-hidden="true" />

            {status === 'demo' && (
              <div ref={resultRef} className="qc-result qc-result--demo" role="alert">
                <p>{q.demoResult}</p>
                <p>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              </div>
            )}
            {(status === 'error' || status === 'invalid' || status === 'rate' || status === 'captcha' || status === 'disabled') && (
              <div ref={resultRef} className="qc-result qc-result--err" role="alert">
                <p>
                  {status === 'invalid' ? q.invalidResult : status === 'rate' ? q.rateLimited : status === 'captcha' ? q.captchaFailed : status === 'disabled' ? q.disabledResult : q.errorResult}
                </p>
                {(status === 'error' || status === 'captcha' || status === 'invalid') && (
                  <button type="button" className="btn btn-ghost" onClick={() => void submit()} disabled={status === 'captcha' && needsCaptcha && !token}>
                    {q.retry}
                  </button>
                )}
                {(status === 'rate' || status === 'disabled' || status === 'error') && (
                  <p>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </p>
                )}
              </div>
            )}
          </form>
        </Step>
      </Stepper>
    </div>
  );
}
