// Community waitlist — shared rules for the client island AND the Pages Function, so the two can
// never disagree. No dependencies, no DOM, runs in the browser, Node and Cloudflare Workers.
//
// The owner wants the counter to start at 48 (FOMO, 2026-11-07). Only real signups are stored in
// D1; the displayed number is `WAITLIST_BASELINE + real active signups`, capped at the goal.

export const WAITLIST_GOAL = 100;
export const WAITLIST_BASELINE = 48;
/** Real rows that fill the displayed counter (100 − 48 = 52). */
export const WAITLIST_CAPACITY = WAITLIST_GOAL - WAITLIST_BASELINE;

export const WAITLIST_LIMITS = {
  emailMax: 254,
  payloadBytes: 2048,
} as const;

export const WAITLIST_CONSENT_VERSION = '2026-11-07';

// Canonical Vietnamese wording stored as evidence. The visible notice is
// `waitlist.consent` + link to the privacy policy in src/i18n/overrides.ts; keep the two aligned.
export const WAITLIST_CONSENT_TEXT =
  'Bằng cách bấm Đăng ký, tôi đồng ý nhận email về cộng đồng và đồng ý để Drafty Lab xử lý email của tôi theo Chính sách bảo vệ dữ liệu cá nhân.';

const CONTROL = new RegExp('[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f\\u2028\\u2029]', 'g');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const clean = (v: unknown): string => {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL, '').normalize('NFC').replace(/\s+/g, ' ').trim();
};

/** Stored form of an email: trimmed + lower-case. */
export const normalizeEmail = (v: unknown): string => clean(v).toLowerCase();

export const isValidEmail = (v: string): boolean =>
  v.length > 0 && v.length <= WAITLIST_LIMITS.emailMax && EMAIL_RE.test(v);

export interface WaitlistInput {
  email: string;
  locale: string;
  consent: true;
}

export type WaitlistResult =
  | { ok: true; value: WaitlistInput }
  | { ok: false; errors: { email?: 'invalid'; consent?: 'required' } };

const LOCALE_RE = /^[a-z]{2}$/;

export function validateWaitlist(raw: unknown): WaitlistResult {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: Extract<WaitlistResult, { ok: false }>['errors'] = {};

  const email = normalizeEmail(r.email);
  if (!isValidEmail(email)) errors.email = 'invalid';

  if (r.consent !== true) errors.consent = 'required';

  if (Object.keys(errors).length) return { ok: false, errors };

  const locale = clean(r.locale).toLowerCase();
  return {
    ok: true,
    value: { email, locale: LOCALE_RE.test(locale) ? locale : 'vi', consent: true },
  };
}

/** Real D1 rows → the number shown on the page (48 + real, capped at 100). */
export const displayCount = (real: number): number =>
  Math.min(WAITLIST_GOAL, Math.max(0, Math.floor(real) + WAITLIST_BASELINE));

/** Spots left in the displayed counter. */
export const remainingCount = (real: number): number => Math.max(0, WAITLIST_GOAL - displayCount(real));
