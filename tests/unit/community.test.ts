import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH } from '../../functions/_lib/admin-auth.ts';
import { cleanUrl, handleAdmin, handleImage, handlePublicList, handlePublicSkills, sniffImage } from '../../functions/_lib/community.ts';
import type { Env } from '../../functions/_lib/env.ts';
import { makeD1 } from './d1-sqlite.ts';

const ORIGIN = 'https://draftylab.pages.dev';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function setup(over: Partial<Env> = {}) {
  const { db, raw } = makeD1();
  const bucket = new Map<string, Uint8Array>();
  const emails: Array<{ to: string[]; subject: string; text: string }> = [];
  let now = 1_800_000_000_000;
  const env = {
    DB: db,
    MEDIA_BUCKET: {
      put: async (k: string, v: Uint8Array) => void bucket.set(k, v),
      get: async (k: string) => (bucket.has(k) ? { body: bucket.get(k) } : null),
      delete: async (k: string) => void bucket.delete(k),
    },
    RATE_SALT: 'test-salt',
    ADMIN_ENABLED: 'true',
    RESEND_API_KEY: 'k',
    LEAD_TO_EMAIL: 'owner@example.com',
    LEAD_FROM_EMAIL: 'a@example.com',
    ...over,
  } as unknown as Env;
  const deps = {
    fetch: (async (_: unknown, init?: RequestInit) => {
      emails.push(JSON.parse(String(init?.body)));
      return new Response('{}', { status: 200 });
    }) as typeof fetch,
    now: () => now,
    waitUntil: () => {},
  };
  const call = (path: string, init: { method?: string; body?: BodyInit; json?: unknown; cookie?: string; ip?: string; origin?: string | null } = {}) => {
    const headers: Record<string, string> = { 'CF-Connecting-IP': init.ip ?? '203.0.113.7' };
    if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
    if (init.cookie) headers.Cookie = init.cookie;
    if (init.json !== undefined) headers['Content-Type'] = 'application/json';
    const req = new Request(`${ORIGIN}/api/admin/${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
    return handleAdmin(req, env, deps, path.split('/'));
  };
  const lastCode = () => /(\d{6})/.exec(emails.filter((e) => e.subject.includes('Mã đăng nhập')).at(-1)!.text)![1];
  const login = async () => {
    await call('login/request', { method: 'POST' });
    const res = await call('login/verify', { method: 'POST', json: { code: lastCode() } });
    assert.equal(res.status, 200);
    return res.headers.get('Set-Cookie')!.split(';')[0];
  };
  const form = (fields: Record<string, string> = {}, image: Uint8Array | null = PNG) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    if (image) f.set('image', new File([image], 'a.png'));
    return f;
  };
  const post = (cookie: string, title: string) =>
    call('posts', { method: 'POST', cookie, body: form({ title, url: 'https://example.com/doc', description: 'mô tả' }) });
  return { env, raw, bucket, emails, deps, call, login, lastCode, form, post, advance: (s: number) => (now += s * 1000) };
}

test('the code goes only to the fixed address, stored hashed, and logs in once', async () => {
  const s = setup();
  const res = await s.call('login/request', { method: 'POST', json: { to: 'attacker@example.com' } });
  assert.equal(res.status, 200);
  assert.deepEqual(s.emails[0].to, ['owner@example.com']);
  const code = s.lastCode();
  const row = s.raw.prepare('SELECT code_hash FROM admin_login_codes').get() as { code_hash: string };
  assert.notEqual(row.code_hash, code);
  assert.equal(row.code_hash.length, 64);

  const ok = await s.call('login/verify', { method: 'POST', json: { code } });
  assert.equal(ok.status, 200);
  const cookie = ok.headers.get('Set-Cookie')!;
  assert.match(cookie, /^__Host-dfl_admin=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code } })).status, 401, 'single use');
  const session = await s.call('session', { cookie: cookie.split(';')[0] });
  assert.equal(((await session.json()) as { authed: boolean }).authed, true);
});

test('an expired code is refused', async () => {
  const s = setup();
  await s.call('login/request', { method: 'POST' });
  s.advance(AUTH.codeTtlS + 1);
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code: s.lastCode() } })).status, 401);
});

test('5 wrong codes lock that IP, even with the right code, then it recovers', async () => {
  const s = setup();
  await s.call('login/request', { method: 'POST' });
  const code = s.lastCode();
  const wrong = code === '000000' ? '000001' : '000000';
  for (let i = 0; i < AUTH.ipFailMax; i++) assert.equal((await s.call('login/verify', { method: 'POST', json: { code: wrong } })).status, 401);
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code } })).status, 429);
  s.advance(AUTH.ipFailWindowS + 1);
  await s.call('login/request', { method: 'POST' });
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code: s.lastCode() } })).status, 200);
});

test('a code dies after 5 tries from different IPs', async () => {
  const s = setup();
  await s.call('login/request', { method: 'POST' });
  const code = s.lastCode();
  const wrong = code === '000000' ? '000001' : '000000';
  for (let i = 0; i < AUTH.maxCodeAttempts; i++) await s.call('login/verify', { method: 'POST', json: { code: wrong }, ip: `198.51.100.${i}` });
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code }, ip: '198.51.100.99' })).status, 401);
});

test('20 wrong codes across IPs lock the login for everyone and alert the owner once', async () => {
  const s = setup();
  for (let i = 0; i < AUTH.globalFailMax; i++) await s.call('login/verify', { method: 'POST', json: { code: '123456' }, ip: `198.51.100.${i}` });
  assert.equal((await s.call('login/verify', { method: 'POST', json: { code: '123456' }, ip: '192.0.2.1' })).status, 429);
  assert.equal((await s.call('login/request', { method: 'POST', ip: '192.0.2.1' })).status, 429);
  assert.equal(s.emails.filter((e) => e.subject.includes('Cảnh báo')).length, 1);
});

test('the send button cannot flood the inbox', async () => {
  const s = setup();
  assert.equal((await s.call('login/request', { method: 'POST' })).status, 200);
  assert.equal((await s.call('login/request', { method: 'POST' })).status, 429, 'cooldown');
  for (let i = 1; i < AUTH.maxSendsPerHour; i++) {
    s.advance(AUTH.sendCooldownS);
    assert.equal((await s.call('login/request', { method: 'POST' })).status, 200);
  }
  s.advance(AUTH.sendCooldownS);
  assert.equal((await s.call('login/request', { method: 'POST' })).status, 429, 'hourly cap');
  assert.equal(s.emails.length, AUTH.maxSendsPerHour);
});

test('every write needs a session and the site origin; preview is switched off', async () => {
  const s = setup();
  assert.equal((await s.call('posts')).status, 401);
  assert.equal((await s.post('dfl_admin=nope', 'x')).status, 401);
  const cookie = await s.login();
  const crossSite = await s.call('posts', { method: 'POST', cookie, origin: 'https://evil.example', body: s.form({ title: 'x', url: 'https://a.b' }) });
  assert.equal(crossSite.status, 403);

  const preview = setup({ ADMIN_ENABLED: 'false' });
  assert.equal((await preview.call('login/request', { method: 'POST' })).status, 404);
});

test('logout ends the session', async () => {
  const s = setup();
  const cookie = await s.login();
  assert.equal((await s.call('logout', { method: 'POST', cookie })).status, 200);
  assert.equal((await s.call('posts', { cookie })).status, 401);
});

test('the public list has only the 3 newest published posts', async () => {
  const s = setup();
  const cookie = await s.login();
  for (const title of ['một', 'hai', 'ba', 'bốn']) {
    assert.equal((await s.post(cookie, title)).status, 201);
    s.advance(1);
  }
  let body = (await (await handlePublicList(s.env)).json()) as { items: Array<{ id: string; title: string; image: string; createdAt: number }> };
  assert.deepEqual(body.items.map((i) => i.title), ['bốn', 'ba', 'hai']);
  // The card's date badge needs the posting time; it must reach the browser with the list.
  assert.ok(body.items.every((i) => Number.isFinite(i.createdAt)), 'every item carries createdAt');

  const hide = await s.call(`posts/${body.items[0].id}`, { method: 'POST', cookie, body: s.form({ status: 'hidden' }, null) });
  assert.equal(hide.status, 200);
  body = (await (await handlePublicList(s.env)).json()) as typeof body;
  assert.deepEqual(body.items.map((i) => i.title), ['ba', 'hai', 'một']);
});

test('the owner can drag cards into a new order', async () => {
  const s = setup();
  const cookie = await s.login();
  for (const title of ['một', 'hai', 'ba']) {
    assert.equal((await s.post(cookie, title)).status, 201);
    s.advance(1);
  }
  const read = async () =>
    (await (await handlePublicList(s.env)).json()) as { items: Array<{ id: string; title: string }> };
  const before = await read();
  assert.deepEqual(before.items.map((i) => i.title), ['ba', 'hai', 'một']);

  const ids = [before.items[2].id, before.items[0].id, before.items[1].id];
  const res = await s.call('posts/reorder', { method: 'POST', cookie, json: { ids } });
  assert.equal(res.status, 200);
  assert.deepEqual((await read()).items.map((i) => i.title), ['một', 'ba', 'hai']);
  // /admin reads the same order, so the list there matches the site.
  const admin = (await (await s.call('posts', { cookie })).json()) as { items: Array<{ title: string }> };
  assert.deepEqual(admin.items.map((i) => i.title), ['một', 'ba', 'hai']);

  // A post created after a drag still lands on top (sort_order NULL sorts by created_at).
  s.advance(1);
  assert.equal((await s.post(cookie, 'mới')).status, 201);
  assert.deepEqual((await read()).items.map((i) => i.title), ['mới', 'một', 'ba']);
});

test('the posting date can be changed from /admin', async () => {
  const s = setup();
  const cookie = await s.login();
  assert.equal((await s.post(cookie, 'một')).status, 201);
  const id = ((await (await handlePublicList(s.env)).json()) as { items: Array<{ id: string }> }).items[0].id;
  const when = Date.UTC(2024, 0, 2, 12);
  const res = await s.call(`posts/${id}`, { method: 'POST', cookie, body: s.form({ createdAt: String(when) }, null) });
  assert.equal(res.status, 200);
  const after = (await (await handlePublicList(s.env)).json()) as { items: Array<{ id: string; createdAt: number }> };
  assert.equal(after.items.find((i) => i.id === id)?.createdAt, when);
  // Malformed dates are rejected instead of silently resetting to now.
  assert.equal((await s.call(`posts/${id}`, { method: 'POST', cookie, body: s.form({ createdAt: '123' }, null) })).status, 400);
});

test('bad links and non-image uploads are refused', async () => {  const s = setup();
  const cookie = await s.login();
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'not a url', 'https://user:pw@example.com/']) {
    assert.equal(cleanUrl(url), null, url);
    assert.equal((await s.call('posts', { method: 'POST', cookie, body: s.form({ title: 't', url }) })).status, 400, url);
  }
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal(sniffImage(svg), null);
  assert.equal((await s.call('posts', { method: 'POST', cookie, body: s.form({ title: 't', url: 'https://a.b' }, svg) })).status, 400);
  const big = new Uint8Array(3 * 1024 * 1024 + 1);
  big.set(PNG);
  assert.equal((await s.call('posts', { method: 'POST', cookie, body: s.form({ title: 't', url: 'https://a.b' }, big) })).status, 413);
  assert.equal(s.bucket.size, 0, 'nothing refused reaches storage');
});

test('replacing and deleting a post removes its old image', async () => {
  const s = setup();
  const cookie = await s.login();
  const { id } = (await (await s.post(cookie, 't')).json()) as { id: string };
  const first = [...s.bucket.keys()];
  assert.equal((await s.call(`posts/${id}`, { method: 'POST', cookie, body: s.form({}) })).status, 200);
  assert.equal(s.bucket.size, 1);
  assert.notDeepEqual([...s.bucket.keys()], first);
  assert.equal((await s.call(`posts/${id}`, { method: 'DELETE', cookie })).status, 200);
  assert.equal(s.bucket.size, 0);
  assert.equal((await s.call(`posts/${id}`, { method: 'DELETE', cookie })).status, 404);
});

test('images are only served from the community folder', async () => {
  const s = setup();
  s.bucket.set('secret.mp4', PNG);
  const get = (key: string) => handleImage(new Request(`${ORIGIN}/x`), s.env, key);
  assert.equal((await get('../secret.mp4')).status, 404);
  assert.equal((await get('secret.mp4')).status, 404);
  assert.equal((await get('0'.repeat(32) + '.png')).status, 404);
  s.bucket.set(`community/${'0'.repeat(32)}.png`, PNG);
  const ok = await get('0'.repeat(32) + '.png');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Content-Type'), 'image/png');
  assert.equal(ok.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('remember keeps a device 90 days, otherwise 12 hours; a sign-in emails the owner', async () => {
  const s = setup();
  await s.call('login/request', { method: 'POST' });
  const remembered = await s.call('login/verify', { method: 'POST', json: { code: s.lastCode(), remember: true } });
  assert.match(remembered.headers.get('Set-Cookie')!, new RegExp(`Max-Age=${AUTH.rememberTtlS}`));
  const cookie = remembered.headers.get('Set-Cookie')!.split(';')[0];
  s.advance(AUTH.shortTtlS + 1);
  assert.equal((await s.call('posts', { cookie })).status, 200, 'still signed in after 12 hours');
  assert.ok(s.emails.at(-1)!.subject.includes('đăng nhập'));
  s.advance(AUTH.rememberTtlS);
  assert.equal((await s.call('posts', { cookie })).status, 401, 'expired after 90 days');

  await s.call('login/request', { method: 'POST' });
  const short = await s.call('login/verify', { method: 'POST', json: { code: s.lastCode() } });
  assert.match(short.headers.get('Set-Cookie')!, new RegExp(`Max-Age=${AUTH.shortTtlS}`));
  const shortCookie = short.headers.get('Set-Cookie')!.split(';')[0];
  s.advance(AUTH.shortTtlS + 1);
  assert.equal((await s.call('posts', { cookie: shortCookie })).status, 401);
});

test('the emergency button signs out every device and needs a session', async () => {
  const s = setup();
  assert.equal((await s.call('devices/revoke-all', { method: 'POST' })).status, 401);
  const phone = await s.login();
  s.advance(AUTH.sendCooldownS);
  const laptop = await s.login();
  const count = (await (await s.call('devices', { cookie: phone })).json()) as { count: number };
  assert.equal(count.count, 2);
  assert.equal((await s.call('devices/revoke-all', { method: 'POST', cookie: laptop, origin: 'https://evil.example' })).status, 403);
  assert.equal((await s.call('devices/revoke-all', { method: 'POST', cookie: laptop })).status, 200);
  assert.equal((await s.call('posts', { cookie: phone })).status, 401);
  assert.equal((await s.call('posts', { cookie: laptop })).status, 401);
  s.advance(AUTH.sendCooldownS);
  assert.equal((await s.login()).length > 0, true, 'a new Gmail code still works');
});

test('skills: seeds are public, admin can add, hide and reorder them', async () => {
  const s = setup();
  const cookie = await s.login();

  const read = async () =>
    (await (await handlePublicSkills(s.env)).json()) as {
      items: Array<{ id: string; title: string; description: string; url: string; image: string | null }>;
    };

  let body = await read();
  assert.deepEqual(body.items.map((i) => i.title), ['Video Edit Skill', 'Herk Edit Kit', 'Awesome Claude Video Skills']);
  assert.equal(body.items[0].image, null, 'no cover is null, not a broken URL');
  assert.match(body.items[0].url, /^https:\/\/github\.com\//);

  // Add one with a cover (the test form always carries the PNG).
  const created = await s.call('skills', {
    method: 'POST',
    cookie,
    body: s.form({ title: 'Skill thử', description: 'mô tả', url: 'https://github.com/example/skill' }),
  });
  assert.equal(created.status, 201);
  body = await read();
  const added = body.items.find((i) => i.title === 'Skill thử');
  assert.ok(added?.image, 'cover is served through /api/community/image');

  // Hide: disappears from the public shelf but stays in admin.
  assert.equal((await s.call(`skills/${added!.id}`, { method: 'POST', cookie, body: s.form({ status: 'hidden' }, null) })).status, 200);
  assert.equal((await read()).items.some((i) => i.title === 'Skill thử'), false);

  // Reorder: the ids arrive first-row-first.
  const ids = body.items.map((i) => i.id).reverse();
  assert.equal((await s.call('skills/reorder', { method: 'POST', cookie, json: { ids } })).status, 200);
  assert.deepEqual((await read()).items.map((i) => i.id), ids.slice(0, -1)); // hidden skill excluded from the public list
});
