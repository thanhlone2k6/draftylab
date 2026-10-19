// Shared Quick Call validation — used by the form (client) AND by functions/api/lead.ts (server), so the two can
// never disagree. No dependencies, no DOM, runs in the browser, Node and Cloudflare Workers.
import { BUDGETS, CONTACT_METHODS, INDUSTRIES, NEEDS, TEAMS, type ContactMethod } from '../data/lead-options';

export const LIMITS = { nameMin: 2, nameMax: 80, noteMax: 500, contactMax: 120, payloadBytes: 4096 } as const;

export interface LeadInput {
  industry: string;
  needs: string[];
  team: string;
  /** optional; '' when the visitor did not choose one */
  budget: string;
  name: string;
  method: ContactMethod;
  contact: string;
  note: string;
  consent: boolean;
  requestId: string;
}

export type FieldErrors = Partial<Record<keyof LeadInput, string>>;
export type LeadResult = { ok: true; value: LeadInput } | { ok: false; errors: FieldErrors };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL = new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f\\u2028\\u2029]", "g");

/** Strip control characters, collapse spaces; keep single newlines in notes. */
export const clean = (v: unknown, multiline = false): string => {
  if (typeof v !== 'string') return '';
  const s = v.replace(CONTROL, '').normalize('NFC');
  return (multiline ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ')).trim();
};

/** 0901234567 | +84 901 234 567 | 84901234567 → 0901234567 (10–11 digits). */
export const normalizePhone = (v: string): string => {
  const d = v.replace(/[\s.()-]/g, '');
  return d.replace(/^\+?84/, '0');
};

export const contactValidators: Record<ContactMethod, (v: string) => boolean> = {
  phone: (v) => /^0\d{9,10}$/.test(normalizePhone(v)),
  email: (v) => v.length <= LIMITS.contactMax && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  instagram: (v) => /^@?[A-Za-z0-9._]{1,30}$/.test(v),
  // Free text: WhatsApp/Telegram/Skype/WeChat handles, a Zalo name, a company switchboard… anything the
  // visitor wants us to reach them on. Only length is enforced.
  other: (v) => v.length >= 2 && v.length <= LIMITS.contactMax,
};

export const isValidContact = (method: ContactMethod, raw: string): boolean => contactValidators[method](clean(raw));

/** The canonical stored form of a contact value. */
export const canonicalContact = (method: ContactMethod, v: string): string =>
  method === 'phone'
    ? normalizePhone(v)
    : method === 'instagram'
      ? v.replace(/^@/, '').toLowerCase()
      : method === 'email'
        ? v.toLowerCase()
        : v;

const isOneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] => typeof v === 'string' && (list as readonly string[]).includes(v);

export function validateLead(raw: unknown): LeadResult {
  const errors: FieldErrors = {};
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const industry = clean(r.industry);
  if (!isOneOf(INDUSTRIES, industry)) errors.industry = 'invalid';

  const needsRaw = Array.isArray(r.needs) ? r.needs.map((n) => clean(n)) : [];
  const needs = [...new Set(needsRaw)];
  if (needs.length < 1 || needs.length > NEEDS.length || !needs.every((n) => isOneOf(NEEDS, n))) errors.needs = 'invalid';

  const team = clean(r.team);
  if (!isOneOf(TEAMS, team)) errors.team = 'invalid';

  const budget = clean(r.budget);
  if (budget !== '' && !isOneOf(BUDGETS, budget)) errors.budget = 'invalid';

  const name = clean(r.name);
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) errors.name = 'invalid';

  const method = r.method;
  let contact = clean(r.contact);
  if (!isOneOf(CONTACT_METHODS, method)) errors.method = 'invalid';
  else if (!contactValidators[method](contact)) errors.contact = 'invalid';
  else contact = canonicalContact(method, contact);

  const note = clean(r.note, true);
  if (note.length > LIMITS.noteMax) errors.note = 'invalid';

  if (r.consent !== true) errors.consent = 'required';

  const requestId = typeof r.requestId === 'string' ? r.requestId : '';
  if (!UUID_V4.test(requestId)) errors.requestId = 'invalid';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { industry, needs, team, budget, name, method: method as ContactMethod, contact, note, consent: true, requestId: requestId.toLowerCase() } };
}
