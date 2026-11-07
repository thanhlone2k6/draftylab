import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWaitlistGet, handleWaitlistPost, WAITLIST_RATE, type Deps } from '../../functions/_lib/waitlist-handler.ts';
import type { Env } from '../../functions/_lib/env.ts';
import { WAITLIST_BASELINE, WAITLIST_GOAL } from '../../src/lib/waitlist.ts';
import { makeD1 } from './d1-sqlite.ts';

const ORIGIN = 'https://draftylab-v2.pages.dev';
const URL_ = `${ORIGIN}/api/waitlist`;
let seq = 0;

const payload = (over: Record<string, unknown> = {}) => ({
  email: `person${++seq}@example.com`,
  consent: true,
  locale: 'vi',
  ...over,
});

const req = (body: unknown, init: { origin?: string | null; ip?: string; method?: string; type?: string; raw?: string } = {}) => {
  const headers: Record<string, string> = { 'Content-Type': init.type ?? 'application/json', 'CF-Connecting-IP': init.ip ?? '203.0.113.7' };
  if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
  return new Request(URL_, { method: init.method ?? 'POST', headers, body: init.method === 'GET' ? undefined : (init.raw ?? JSON.stringify(body)) });
};

function setup(env: Partial<Env> = {}, fetchImpl?: typeof fetch) {
  const { db, raw } = makeD1();
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const pending: Promise<unknown>[] = [];
  const deps: Deps = {
    fetch: (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return fetchImpl ? fetchImpl(url, init) : new Response('{}', { status: 200 });
    }) as typeof fetch,
    now: () => 1_800_000_000_000,
    waitUntil: (p) => void pending.push(p),
    randomId: () => `wl${++seq}`,
  };
  const e = { DB: db, MEDIA_BUCKET: {} as R2Bucket, RATE_SALT: 's', ...env } as Env;
  const run = async (r: Request) => {
    const res = await handleWaitlistPost(r, e, deps);
    await Promise.all(pending.splice(0));
    return res;
  };
  const get = () => handleWaitlistGet(e);
  return { run, get, raw, calls };
}

const rows = (raw: ReturnType<typeof setup>['raw']) => raw.prepare('SELECT * FROM waitlist').all() as Array<Record<string, unknown>>;

function seed(raw: ReturnType<typeof setup>['raw'], n: number, status = 'active') {
  for (let i = 0; i < n; i++) {
    raw
      .prepare('INSERT INTO waitlist (id, email, created_at, locale, source, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(`seed${status}${i}`, `seed-${status}-${i}@example.com`, 1, 'vi', 'community', status);
  }
}

test('GET starts at the 48-person head start and reports the goal', async () => {
  const { get } = setup();
  const res = await get();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, count: WAITLIST_BASELINE, goal: WAITLIST_GOAL, full: false });
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

test('success stores a canonical email + consent evidence and answers with the next position', async () => {
  const { run, raw } = setup();
  const res = await run(req(payload({ email: '  Lan.Anh@Example.COM  ' })));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.count, WAITLIST_BASELINE + 1);
  assert.equal(body.position, WAITLIST_BASELINE + 1);
  assert.equal(body.duplicate, false);
  const [row] = rows(raw);
  assert.equal(row.email, 'lan.anh@example.com');
  assert.equal(row.locale, 'vi');
  assert.equal(row.source, 'community');
  assert.equal(row.status, 'active');
  assert.equal(row.notify, 'skipped'); // LEAD_NOTIFY unset → stored only
  assert.equal(row.consent_version, '2026-11-07');
  assert.equal(row.consent_at, row.created_at);
  assert.match(String(row.consent_text), /Chính sách bảo vệ dữ liệu cá nhân/);
});

test('duplicate email does not create a second row or a notification', async () => {
  const { run, raw, calls } = setup({ LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'k', LEAD_TO_EMAIL: 'a@b.co', LEAD_FROM_EMAIL: 'c@d.co' });
  const p = payload({ email: 'same@example.com' });
  assert.equal((await run(req(p))).status, 200);
  const b = await run(req(p));
  assert.equal(b.status, 200);
  const body = await b.json();
  assert.equal(body.duplicate, true);
  assert.equal(rows(raw).length, 1);
  assert.equal(calls.length, 1); // only the first signup notified
});

test('invalid email / missing consent → 400 naming fields only', async () => {
  const { run, raw } = setup();
  const res = await run(req(payload({ email: 'not-an-email', consent: false })));
  assert.equal(res.status, 400);
  const text = await res.text();
  assert.ok(text.includes('"fields"'));
  assert.ok(!text.includes('not-an-email'));
  assert.equal(rows(raw).length, 0);
});

test('method / content type / origin / size / json guards', async () => {
  const { run, raw } = setup();
  assert.equal((await run(req({}, { method: 'GET' }))).status, 405);
  assert.equal((await run(req(payload(), { type: 'text/plain' }))).status, 415);
  assert.equal((await run(req(payload(), { origin: null }))).status, 403);
  assert.equal((await run(req(payload(), { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await run(req(null, { raw: 'x'.repeat(3000) }))).status, 413);
  assert.equal((await run(req(null, { raw: '{not json' }))).status, 400);
  assert.equal((await run(req(null, { raw: '[1,2]' }))).status, 400);
  assert.equal(rows(raw).length, 0);
});

test('WAITLIST_ENABLED=false is an independent kill switch; LEAD_ENABLED does not affect it', async () => {
  const off = setup({ WAITLIST_ENABLED: 'false' });
  assert.equal((await off.run(req(payload()))).status, 503);

  const leadsOff = setup({ LEAD_ENABLED: 'false' });
  assert.equal((await leadsOff.run(req(payload()))).status, 200);
});

test('extra allowed origins come from ALLOWED_ORIGINS', async () => {
  const { run } = setup({ ALLOWED_ORIGINS: 'https://drafty.example, https://www.drafty.example' });
  assert.equal((await run(req(payload(), { origin: 'https://www.drafty.example' }))).status, 200);
  assert.equal((await run(req(payload(), { origin: 'https://other.example' }))).status, 403);
});

test('honeypot looks successful but stores nothing', async () => {
  const { run, raw, calls } = setup({ LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'k', LEAD_TO_EMAIL: 'a@b.co', LEAD_FROM_EMAIL: 'c@d.co' });
  const res = await run(req(payload({ website: 'http://spam.example' })));
  assert.equal(res.status, 200);
  assert.equal(rows(raw).length, 0);
  assert.equal(calls.length, 0);
});

test('rate limit: 6th signup from one IP → 429; other IPs unaffected', async () => {
  const { run, raw } = setup();
  for (let i = 0; i < WAITLIST_RATE.max; i++) assert.equal((await run(req(payload(), { ip: '198.51.100.9' }))).status, 200);
  const limited = await run(req(payload(), { ip: '198.51.100.9' }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), String(WAITLIST_RATE.windowSeconds));
  assert.equal((await run(req(payload(), { ip: '198.51.100.10' }))).status, 200);
  const stored = JSON.stringify(raw.prepare('SELECT * FROM waitlist_rate').all()) + JSON.stringify(rows(raw));
  assert.ok(!stored.includes('198.51.100'));
});

test('the 52nd real signup fills the display at 100, then new signups are refused', async () => {
  const { run, get, raw } = setup();
  seed(raw, WAITLIST_GOAL - WAITLIST_BASELINE - 1); // 51 real rows → 99 displayed
  const last = await run(req(payload({ email: 'last@example.com' })));
  assert.equal(last.status, 200);
  assert.equal((await last.json()).count, 100);
  assert.equal((await get()).status, 200);

  const full = await run(req(payload({ email: 'overflow@example.com' })));
  assert.equal(full.status, 409);
  assert.equal((await full.json()).code, 'full');
  const fullBody = await (await get()).json();
  assert.equal(fullBody.full, true);
});

test('GET counts only active rows', async () => {
  const { get, raw } = setup();
  seed(raw, 2, 'active');
  seed(raw, 1, 'unsubscribed');
  seed(raw, 1, 'spam');
  const body = await (await get()).json();
  assert.equal(body.count, WAITLIST_BASELINE + 2);
});

test('a new signup emails the owner with the address and a direct reply-to', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fake = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: 're_123' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  const { run, raw } = setup({ LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'k', LEAD_TO_EMAIL: 'owner@example.com', LEAD_FROM_EMAIL: 'Drafty <on@resend.dev>' }, fake);

  assert.equal((await run(req(payload({ email: 'new.person@example.com', locale: 'en' })))).status, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /api\.resend\.com/);
  const sent = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(sent.to, ['owner@example.com']);
  assert.equal(sent.reply_to, 'new.person@example.com');
  assert.match(sent.subject, /Waitlist signup #49/);
  assert.match(sent.text, /new\.person@example\.com/);
  assert.match(sent.text, /49\/100/);

  const [row] = rows(raw);
  assert.equal(row.notify, 'sent');
  assert.equal(row.notify_ref, 're_123');
});
