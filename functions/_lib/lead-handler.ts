// POST /api/lead — validation, anti-spam, storage, notification. Pure function of (request, env, deps) so it can
// be unit-tested in Node with a fake D1. Responses never echo personal data and never leak internals.
import type { Env } from './env';
import { notifyLead, type Fetch } from './notify';
import { LIMITS, validateLead } from '../../src/lib/lead-schema';

export const RATE = { max: 5, windowSeconds: 600 } as const;

export interface Deps {
  fetch: Fetch;
  now: () => number; // ms
  waitUntil: (p: Promise<unknown>) => void;
  randomId: () => string;
}

const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false; // browsers always send Origin on cross-site/JSON POSTs; reject anything else
  const own = new URL(request.url).origin;
  const extra = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return origin === own || extra.includes(origin);
}

async function verifyTurnstile(env: Env, token: unknown, ip: string | null, doFetch: Fetch): Promise<boolean> {
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

export async function handleLead(request: Request, env: Env, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return json(405, { ok: false, code: 'method' }, { Allow: 'POST' });
  if (env.LEAD_ENABLED === 'false') return json(503, { ok: false, code: 'disabled' });
  if (!originAllowed(request, env)) return json(403, { ok: false, code: 'origin' });
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, code: 'type' });

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > LIMITS.payloadBytes) return json(413, { ok: false, code: 'too_large' });
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.payloadBytes) return json(413, { ok: false, code: 'too_large' });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
  } catch {
    return json(400, { ok: false, code: 'bad_json' });
  }

  // Honeypot: look successful to bots, store nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json(200, { ok: true });

  const parsed = validateLead(body);
  if (!parsed.ok) return json(400, { ok: false, code: 'invalid', fields: Object.keys(parsed.errors) });
  const lead = parsed.value;

  const ip = request.headers.get('CF-Connecting-IP');
  if (env.TURNSTILE_SECRET) {
    if (!(await verifyTurnstile(env, body.turnstileToken, ip, deps.fetch))) return json(403, { ok: false, code: 'captcha' });
  }

  try {
    const nowS = Math.floor(deps.now() / 1000);

    // Idempotent retry: the same requestId returns success without creating or notifying again.
    const existing = await env.DB.prepare('SELECT id FROM leads WHERE request_id = ?').bind(lead.requestId).first<{ id: string }>();
    if (existing) return json(200, { ok: true, duplicate: true });

    // Rate limit per hashed IP.
    const ipHash = (await sha256Hex(`${env.RATE_SALT || 'dfl2'}|${ip || 'unknown'}`)).slice(0, 32);
    const since = nowS - RATE.windowSeconds;
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limit WHERE ip_hash = ? AND ts > ?').bind(ipHash, since).first<{ n: number }>();
    if ((row?.n ?? 0) >= RATE.max) return json(429, { ok: false, code: 'rate_limited' }, { 'Retry-After': String(RATE.windowSeconds) });
    await env.DB.batch([
      env.DB.prepare('INSERT INTO rate_limit (ip_hash, ts) VALUES (?, ?)').bind(ipHash, nowS),
      env.DB.prepare('DELETE FROM rate_limit WHERE ts < ?').bind(nowS - 3600),
    ]);

    const id = deps.randomId();
    await env.DB.prepare(
      'INSERT INTO leads (id, request_id, created_at, industry, needs, team, budget, name, method, contact, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(id, lead.requestId, nowS, lead.industry, JSON.stringify(lead.needs), lead.team, lead.budget, lead.name, lead.method, lead.contact, lead.note)
      .run();

    const meta = { id, host: new URL(request.url).host, at: deps.now() };
    deps.waitUntil(
      notifyLead(env, lead, meta, deps.fetch).then((r) => env.DB.prepare('UPDATE leads SET notify = ?, notify_ref = ? WHERE id = ?').bind(r.status, r.ref, id).run()),
    );
    return json(200, { ok: true });
  } catch (e) {
    // Only an error class is logged — never the lead.
    console.error('lead_error', e instanceof Error ? e.name : 'unknown');
    return json(500, { ok: false, code: 'server' });
  }
}
