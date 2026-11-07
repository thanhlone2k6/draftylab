// POST /api/waitlist — store a community-waitlist email and notify the owner so they can send the
// welcome mail themselves. GET /api/waitlist — the public counter (no emails ever leave the DB).
// Pure function of (request, env, deps) so it can be unit-tested in Node with a fake D1.
import type { Env } from './env';
import { json, sha256Hex } from './admin-auth';
import { notifyWaitlistSignup } from './notify';
import {
  WAITLIST_CAPACITY,
  WAITLIST_CONSENT_TEXT,
  WAITLIST_CONSENT_VERSION,
  WAITLIST_GOAL,
  WAITLIST_LIMITS,
  displayCount,
  validateWaitlist,
} from '../../src/lib/waitlist';

export const WAITLIST_RATE = { max: 5, windowSeconds: 600 } as const;

export interface Deps {
  fetch: typeof fetch;
  now: () => number; // ms
  waitUntil: (p: Promise<unknown>) => void;
  randomId: () => string;
}

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false; // browsers always send Origin on cross-site/JSON POSTs; reject anything else
  const own = new URL(request.url).origin;
  const extra = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return origin === own || extra.includes(origin);
}

async function verifyTurnstile(env: Env, token: unknown, ip: string | null, doFetch: typeof fetch): Promise<boolean> {
  if (typeof token !== 'string' || token.length < 10 || token.length > 2048) return false;
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET!, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const res = await doFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function activeCount(env: Env): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM waitlist WHERE status = 'active'").first<{ n: number }>();
  return row?.n ?? 0;
}

export async function handleWaitlistGet(env: Env): Promise<Response> {
  try {
    const real = await activeCount(env);
    const count = displayCount(real);
    return json(200, { ok: true, count, goal: WAITLIST_GOAL, full: count >= WAITLIST_GOAL });
  } catch (e) {
    console.error('waitlist_count_error', e instanceof Error ? e.name : 'unknown');
    return json(500, { ok: false, code: 'server' });
  }
}

export async function handleWaitlistPost(request: Request, env: Env, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return json(405, { ok: false, code: 'method' }, { Allow: 'POST' });
  if (env.WAITLIST_ENABLED === 'false') return json(503, { ok: false, code: 'disabled' });
  if (!originAllowed(request, env)) return json(403, { ok: false, code: 'origin' });
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, code: 'type' });

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > WAITLIST_LIMITS.payloadBytes) return json(413, { ok: false, code: 'too_large' });
  const text = await request.text();
  if (new TextEncoder().encode(text).length > WAITLIST_LIMITS.payloadBytes) return json(413, { ok: false, code: 'too_large' });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
  } catch {
    return json(400, { ok: false, code: 'bad_json' });
  }

  // Honeypot: look successful to bots, store nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    const real = await activeCount(env).catch(() => 0);
    return json(200, { ok: true, count: displayCount(real), goal: WAITLIST_GOAL, duplicate: false });
  }

  const parsed = validateWaitlist(body);
  if (!parsed.ok) return json(400, { ok: false, code: 'invalid', fields: Object.keys(parsed.errors) });
  const w = parsed.value;

  const ip = request.headers.get('CF-Connecting-IP');
  // Required when the secret is configured (production). Local/preview without a secret stay usable.
  if (env.TURNSTILE_SECRET) {
    if (!(await verifyTurnstile(env, body.turnstileToken, ip, deps.fetch))) return json(403, { ok: false, code: 'captcha' });
  }

  try {
    const nowS = Math.floor(deps.now() / 1000);

    // Rate limit per hashed IP first, so duplicate probes cannot be used to enumerate emails for
    // free. Its own table keeps the Quick Call form's quota separate.
    const ipHash = (await sha256Hex(`${env.RATE_SALT || 'dfl2'}|${ip || 'unknown'}`)).slice(0, 32);
    const since = nowS - WAITLIST_RATE.windowSeconds;
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM waitlist_rate WHERE ip_hash = ? AND ts > ?').bind(ipHash, since).first<{ n: number }>();
    if ((row?.n ?? 0) >= WAITLIST_RATE.max) return json(429, { ok: false, code: 'rate_limited' }, { 'Retry-After': String(WAITLIST_RATE.windowSeconds) });
    await env.DB.batch([
      env.DB.prepare('INSERT INTO waitlist_rate (ip_hash, ts) VALUES (?, ?)').bind(ipHash, nowS),
      env.DB.prepare('DELETE FROM waitlist_rate WHERE ts < ?').bind(nowS - 3600),
    ]);

    // Duplicate email: answer success (no new row, no notification).
    const existing = await env.DB.prepare('SELECT id FROM waitlist WHERE email = ?').bind(w.email).first<{ id: string }>();
    if (existing) {
      const realNow = await activeCount(env);
      return json(200, { ok: true, count: displayCount(realNow), goal: WAITLIST_GOAL, duplicate: true });
    }

    // Atomic capacity check: the WHERE lives in the same statement as the insert, so two
    // simultaneous "100th" signups cannot both be accepted. `changes = 0` means the list was full.
    const id = deps.randomId();
    const inserted = await env.DB.prepare(
      `INSERT INTO waitlist (id, email, created_at, locale, source, consent_at, consent_version, consent_text)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?
       WHERE (SELECT COUNT(*) FROM waitlist WHERE status = 'active') < ?`,
    )
      .bind(id, w.email, nowS, w.locale, 'community', nowS, WAITLIST_CONSENT_VERSION, WAITLIST_CONSENT_TEXT, WAITLIST_CAPACITY)
      .run()
      .catch(async (e) => {
        // Two concurrent identical emails: the loser hits the unique index; treat it as a duplicate.
        if (String(e).includes('UNIQUE constraint failed: waitlist.email')) return null;
        throw e;
      });

    if (inserted === null) {
      const realNow = await activeCount(env);
      return json(200, { ok: true, count: displayCount(realNow), goal: WAITLIST_GOAL, duplicate: true });
    }

    if (Number(inserted.meta?.changes ?? 0) === 0) {
      return json(409, { ok: false, code: 'full', count: WAITLIST_GOAL, goal: WAITLIST_GOAL });
    }

    const realAfter = await activeCount(env);
    const count = displayCount(realAfter);
    const meta = {
      id,
      email: w.email,
      position: count,
      goal: WAITLIST_GOAL,
      locale: w.locale,
      host: new URL(request.url).host,
      at: deps.now(),
    };
    deps.waitUntil(
      notifyWaitlistSignup(env, meta, deps.fetch).then((r) =>
        env.DB.prepare('UPDATE waitlist SET notify = ?, notify_ref = ? WHERE id = ?').bind(r.status, r.ref, id).run(),
      ),
    );

    return json(200, { ok: true, count, goal: WAITLIST_GOAL, position: count, duplicate: false });
  } catch (e) {
    // Only an error class is logged — never the email.
    console.error('waitlist_error', e instanceof Error ? e.name : 'unknown');
    return json(500, { ok: false, code: 'server' });
  }
}
