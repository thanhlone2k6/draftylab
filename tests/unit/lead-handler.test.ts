import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLead, RATE, type Deps } from '../../functions/_lib/lead-handler.ts';
import type { Env } from '../../functions/_lib/env.ts';
import { makeD1 } from './d1-sqlite.ts';

const ORIGIN = 'https://draftylab-v2.pages.dev';
const URL_ = `${ORIGIN}/api/lead`;
let seq = 0;
const uuid = () => `3f1c2b7e-5a9d-4c1e-8b3a-${String(++seq).padStart(12, '0')}`;
const payload = (over: Record<string, unknown> = {}) => ({
  industry: 'F&B / Restaurant', needs: ['Video Editing'], team: 'Tự làm', budget: '5 – 15 triệu', name: 'Lan Anh', method: 'email',
  contact: 'lan.anh@example.com', note: '', consent: true, requestId: uuid(), ...over,
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
    randomId: () => `lead${++seq}`,
  };
  const e = { DB: db, MEDIA_BUCKET: {} as R2Bucket, RATE_SALT: 's', ...env } as Env;
  const run = async (r: Request) => {
    const res = await handleLead(r, e, deps);
    await Promise.all(pending.splice(0));
    return res;
  };
  return { run, raw, calls };
}
const rows = (raw: ReturnType<typeof setup>['raw']) => raw.prepare('SELECT * FROM leads').all() as Array<Record<string, unknown>>;

test('success stores a canonical lead and answers without personal data', async () => {
  const { run, raw } = setup();
  const res = await run(req(payload({ method: 'phone', contact: '+84 901 234 567', note: 'cần gấp' })));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ['ok']);
  const [row] = rows(raw);
  assert.equal(row.contact, '0901234567');
  assert.equal(row.name, 'Lan Anh');
  assert.equal(row.status, 'new');
  assert.equal(row.notify, 'skipped'); // LEAD_NOTIFY unset → stored only
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

test('method / content type / origin / size / json guards', async () => {
  const { run, raw } = setup();
  assert.equal((await run(req({}, { method: 'GET' }))).status, 405);
  assert.equal((await run(req(payload(), { type: 'text/plain' }))).status, 415);
  assert.equal((await run(req(payload(), { origin: null }))).status, 403);
  assert.equal((await run(req(payload(), { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await run(req(null, { raw: 'x'.repeat(5000) }))).status, 413);
  assert.equal((await run(req(null, { raw: '{not json' }))).status, 400);
  assert.equal((await run(req(null, { raw: '[1,2]' }))).status, 400);
  assert.equal(rows(raw).length, 0);
});

test('extra allowed origins come from ALLOWED_ORIGINS', async () => {
  const { run } = setup({ ALLOWED_ORIGINS: 'https://drafty.example, https://www.drafty.example' });
  assert.equal((await run(req(payload(), { origin: 'https://www.drafty.example' }))).status, 200);
  assert.equal((await run(req(payload(), { origin: 'https://other.example' }))).status, 403);
});

test('invalid fields → 400 naming fields only (never echoing values)', async () => {
  const { run, raw } = setup();
  const res = await run(req(payload({ name: 'A', contact: 'secret-value-zzz', consent: false })));
  assert.equal(res.status, 400);
  const text = await res.text();
  assert.ok(text.includes('"fields"'));
  assert.ok(!text.includes('secret-value-zzz'));
  assert.equal(rows(raw).length, 0);
});

test('honeypot looks successful but stores and notifies nothing', async () => {
  const { run, raw, calls } = setup({ LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'k', LEAD_TO_EMAIL: 'a@b.co', LEAD_FROM_EMAIL: 'c@d.co' });
  const res = await run(req(payload({ website: 'http://spam.example' })));
  assert.equal(res.status, 200);
  assert.equal(rows(raw).length, 0);
  assert.equal(calls.length, 0);
});

test('same requestId is idempotent: one row, one notification', async () => {
  const { run, raw, calls } = setup({ LEAD_NOTIFY: 'telegram', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' });
  const p = payload();
  const a = await run(req(p));
  const b = await run(req(p));
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal((await b.json()).duplicate, true);
  assert.equal(rows(raw).length, 1);
  assert.equal(calls.length, 1);
});

test('rate limit: 6th request from one IP → 429 + Retry-After; other IPs unaffected; IP is never stored', async () => {
  const { run, raw } = setup();
  for (let i = 0; i < RATE.max; i++) assert.equal((await run(req(payload(), { ip: '198.51.100.9' }))).status, 200);
  const limited = await run(req(payload(), { ip: '198.51.100.9' }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), String(RATE.windowSeconds));
  assert.equal((await run(req(payload(), { ip: '198.51.100.10' }))).status, 200);
  const stored = JSON.stringify(raw.prepare('SELECT * FROM rate_limit').all()) + JSON.stringify(rows(raw));
  assert.ok(!stored.includes('198.51.100'));
});

test('Turnstile: required when the secret is set; verified server-side', async () => {
  const ok = (async (u: RequestInfo | URL) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true })) : new Response('{}')) as typeof fetch;
  const bad = (async () => new Response(JSON.stringify({ success: false }))) as typeof fetch;
  const boom = (async () => { throw new Error('network'); }) as typeof fetch;

  let s = setup({ TURNSTILE_SECRET: 'sec' }, ok);
  assert.equal((await s.run(req(payload()))).status, 403); // no token
  assert.equal((await s.run(req(payload({ turnstileToken: 'x'.repeat(30) })))).status, 200);
  const verify = s.calls.find((c) => c.url.includes('siteverify'))!;
  assert.ok(String(verify.init?.body).includes('secret=sec'));
  assert.ok(String(verify.init?.body).includes('remoteip='));

  s = setup({ TURNSTILE_SECRET: 'sec' }, bad);
  assert.equal((await s.run(req(payload({ turnstileToken: 'x'.repeat(30) })))).status, 403);
  assert.equal(rows(s.raw).length, 0);

  s = setup({ TURNSTILE_SECRET: 'sec' }, boom);
  assert.equal((await s.run(req(payload({ turnstileToken: 'x'.repeat(30) })))).status, 403);
});

test('kill switch: LEAD_ENABLED=false → 503', async () => {
  const { run, raw } = setup({ LEAD_ENABLED: 'false' });
  assert.equal((await run(req(payload()))).status, 503);
  assert.equal(rows(raw).length, 0);
});

test('Resend email: subject format, ALL answers in the body, reply-to, idempotency key, message id stored', async () => {
  const env = { LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'rk', LEAD_TO_EMAIL: 'owner@example.com', LEAD_FROM_EMAIL: 'Drafty Lab <onboarding@resend.dev>' };
  const ok = (async () => new Response(JSON.stringify({ id: 're_abc123' }), { status: 200 })) as typeof fetch;
  const s = setup(env, ok);
  const res = await s.run(req(payload({ name: 'Lan\nAnh', needs: ['Video Editing', 'Social Content'], industry: 'Khác', team: 'Có team 3+ người', note: 'ghi chú dòng 1\ndòng 2' })));
  assert.equal(res.status, 200);
  const call = s.calls[0];
  assert.equal(call.url, 'https://api.resend.com/emails');
  const headers = call.init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer rk');
  assert.match(headers['Idempotency-Key'], /^dfl2-lead-/);
  const sent = JSON.parse(String(call.init?.body));
  assert.deepEqual(sent.to, ['owner@example.com']);
  assert.equal(sent.from, 'Drafty Lab <onboarding@resend.dev>');
  assert.equal(sent.subject, '[DFL2] New Lead – Lan Anh'); // exact required format, newline collapsed
  assert.equal(sent.reply_to, 'lan.anh@example.com');
  for (const piece of ['Tên: Lan Anh', 'Liên hệ qua Email: lan.anh@example.com', 'Lĩnh vực kinh doanh: Khác', 'Dịch vụ quan tâm: Video Editing, Social Content', 'Hiện trạng triển khai content: Có team 3+ người', 'Ngân sách dự kiến: 5 – 15 triệu', 'ghi chú dòng 1', 'dòng 2', 'Mã lead:', 'Nguồn: draftylab-v2.pages.dev', 'GMT+7', 'Cloudflare D1']) {
    assert.ok(sent.text.includes(piece), piece);
  }
  const row = rows(s.raw)[0];
  assert.equal(row.notify, 'sent');
  assert.equal(row.notify_ref, 're_abc123');
  assert.equal(row.budget, '5 – 15 triệu');
});

test('email body when optional answers are empty; no reply_to for non-email contacts', async () => {
  const env = { LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'rk', LEAD_TO_EMAIL: 'o@example.com', LEAD_FROM_EMAIL: 'f@example.com' };
  const s = setup(env, (async () => new Response('{"id":"x"}')) as typeof fetch);
  await s.run(req(payload({ budget: '', note: '', method: 'phone', contact: '0901234567' })));
  const sent = JSON.parse(String(s.calls[0].init?.body));
  assert.ok(sent.text.includes('Ngân sách dự kiến: (không chọn)'));
  assert.ok(sent.text.includes('Ghi chú: (không có)'));
  assert.ok(sent.text.includes('Liên hệ qua Zalo / Phone: 0901234567'));
  assert.equal('reply_to' in sent, false);
});

test('notification failure keeps the lead (notify=failed + status code), misconfiguration is skipped', async () => {
  const env = { LEAD_NOTIFY: 'resend', RESEND_API_KEY: 'rk', LEAD_TO_EMAIL: 'owner@example.com', LEAD_FROM_EMAIL: 'forms@example.com' };
  let s = setup(env, (async () => new Response('err', { status: 422 })) as typeof fetch);
  assert.equal((await s.run(req(payload()))).status, 200);
  assert.equal(rows(s.raw).length, 1);
  assert.equal(rows(s.raw)[0].notify, 'failed');
  assert.equal(rows(s.raw)[0].notify_ref, 'err:422');

  s = setup(env, (async () => { throw new Error('offline'); }) as typeof fetch);
  assert.equal((await s.run(req(payload()))).status, 200);
  assert.equal(rows(s.raw)[0].notify, 'failed');
  assert.equal(rows(s.raw)[0].notify_ref, 'err:network');

  s = setup({ LEAD_NOTIFY: 'resend' }); // key missing → skipped, lead still stored
  assert.equal((await s.run(req(payload()))).status, 200);
  assert.equal(rows(s.raw)[0].notify, 'skipped');
});

test('an invalid budget is rejected', async () => {
  const { run, raw } = setup();
  assert.equal((await run(req(payload({ budget: '1 tỷ' })))).status, 400);
  assert.equal(rows(raw).length, 0);
});

test('database failure → 500 without internals, and the log never contains the lead', async () => {
  const { run, raw } = setup();
  raw.exec('DROP TABLE leads');
  const logged: string[] = [];
  const orig = console.error;
  console.error = (...a: unknown[]) => logged.push(a.join(' '));
  try {
    const res = await run(req(payload({ name: 'Rất Bí Mật' })));
    assert.equal(res.status, 500);
    const text = await res.text();
    assert.ok(!/sqlite|table|Bí Mật/i.test(text));
  } finally {
    console.error = orig;
  }
  assert.ok(logged.length > 0);
  assert.ok(!logged.join(' ').includes('Bí Mật'));
  assert.ok(!logged.join(' ').includes('lan.anh@example.com'));
});
