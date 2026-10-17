// Production-like integration: the built site (videos stripped out of dist) served by `wrangler pages dev` with the
// real Pages Functions on workerd, a LOCAL D1 database and a LOCAL R2 bucket. Nothing leaves the machine.
import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { dialog, scrollToId, trackConsoleErrors, waitHydrated } from './helpers';

const d1 = (sql: string): Array<Record<string, unknown>> => {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out)[0].results;
};
const resetRate = () => d1('DELETE FROM rate_limit');

async function fillAndSubmit(page: Page, email: string, consent = true, budget?: string) {
  await page.locator('.hero__ctas [data-dfl-open="quickcall"]').click();
  const d = dialog(page);
  await expect(d.locator('.qc')).toBeVisible({ timeout: 30_000 });
  await d.getByRole('radio', { name: 'F&B / Restaurant' }).click();
  const next = d.locator('.stepper__button--next');
  await next.click();
  await d.getByRole('checkbox', { name: 'Video Editing' }).click();
  await next.click();
  await d.getByRole('radio', { name: 'Tự làm' }).click();
  if (budget) await d.getByRole('radio', { name: budget }).click(); // optional question
  await next.click();
  await d.getByLabel('Tên của bạn').fill('Khách Thử Nghiệm');
  await d.getByRole('radio', { name: 'Email' }).click();
  await d.getByLabel("Email", { exact: true }).fill(email);
  if (consent) await d.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  return { d, next };
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  // The local database is keyed by the D1 id in wrangler.toml; make sure the schema exists (local only, idempotent).
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--local'], { stdio: 'ignore' });
  d1('DELETE FROM leads');
  resetRate();
});

test('live form: no DEMO banner; consent is required; success only after the server stored the lead', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  const { d, next } = await fillAndSubmit(page, 'khach.thu@example.com', false, '5 – 15 triệu');
  await expect(d.locator('.qc__demo')).toHaveCount(0);
  await expect(next).toBeDisabled(); // consent missing
  await d.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  await expect(next).toBeEnabled();
  expect(await d.locator('.qc-privacy').textContent()).toContain('12 tháng');
  await next.click();
  await expect(d.locator('.qc-result--ok')).toContainText('Đã nhận yêu cầu liên hệ', { timeout: 30_000 });
  await expect(d.locator('.qc-result--demo')).toHaveCount(0);
  const rows = d1("SELECT name, method, contact, industry, needs, team, budget, status, notify, notify_ref FROM leads WHERE contact = 'khach.thu@example.com'");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ name: 'Khách Thử Nghiệm', method: 'email', industry: 'F&B / Restaurant', team: 'Tự làm', budget: '5 – 15 triệu', status: 'new', notify: 'skipped' });
  expect(JSON.parse(String(rows[0].needs))).toEqual(['Video Editing']);
  expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
});

test('API guards over real HTTP: origin, content type, size, validation, honeypot, no PII echoed', async ({ request, baseURL }) => {
  const url = `${baseURL}/api/lead`;
  const good = { industry: 'Khác', needs: ['Chưa rõ, cần tư vấn'], team: 'Tự làm', name: 'An Binh', method: 'instagram', contact: '@an.binh', note: '', consent: true, requestId: '8a7e5c1d-3b2f-4e6a-9c4d-0f1e2d3c4b5a' };
  expect((await request.post(url, { data: good, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
  expect((await request.post(url, { data: good })).status()).toBe(403); // no Origin header
  expect((await request.post(url, { data: 'x', headers: { Origin: baseURL!, 'Content-Type': 'text/plain' } })).status()).toBe(415);
  expect((await request.post(url, { data: { ...good, note: 'x'.repeat(6000) }, headers: { Origin: baseURL! } })).status()).toBe(413);
  const bad = await request.post(url, { data: { ...good, contact: 'secret-not-a-handle!!' }, headers: { Origin: baseURL! } });
  expect(bad.status()).toBe(400);
  expect(await bad.text()).not.toContain('secret-not-a-handle');
  const spam = await request.post(url, { data: { ...good, website: 'http://spam.example' }, headers: { Origin: baseURL! } });
  expect(spam.status()).toBe(200);
  expect(d1("SELECT id FROM leads WHERE contact = 'an.binh'")).toHaveLength(0);
  expect((await request.get(url)).status()).toBe(405);
  const ok = await request.post(url, { data: good, headers: { Origin: baseURL! } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toEqual({ ok: true });
  expect(ok.headers()['cache-control']).toBe('no-store');
  // idempotent retry with the same requestId
  const again = await request.post(url, { data: good, headers: { Origin: baseURL! } });
  expect(await again.json()).toMatchObject({ ok: true, duplicate: true });
  expect(d1("SELECT id FROM leads WHERE contact = 'an.binh'")).toHaveLength(1);
});

test('rate limit over real HTTP: the 6th submission from one client is refused with Retry-After', async ({ request, baseURL }) => {
  resetRate();
  const mk = (i: number) => ({ industry: 'Khác', needs: ['Video Editing'], team: 'Tự làm', name: `Tester ${i}`, method: 'email', contact: `rate${i}@example.com`, note: '', consent: true, requestId: `00000000-0000-4000-8000-00000000000${i}` });
  const codes: number[] = [];
  let retry = '';
  for (let i = 0; i < 7; i++) {
    const r = await request.post(`${baseURL}/api/lead`, { data: mk(i), headers: { Origin: baseURL! } });
    codes.push(r.status());
    if (r.status() === 429) retry = r.headers()['retry-after'];
  }
  expect(codes.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
  expect(codes[5]).toBe(429);
  expect(retry).toBe('600');
  resetRate();
});

test('form shows the right message and recovery for 400 / 403 / 429 / 503 / 500 / network errors', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  const { d, next } = await fillAndSubmit(page, 'loi.thu@example.com');
  const cases: Array<[number | 'abort', RegExp, boolean]> = [
    [400, /chưa hợp lệ/, true],
    [403, /xác minh/, true],
    [429, /vài phút/, false],
    [503, /tạm ngưng/, false],
    [500, /Không gửi được/, true],
    ['abort', /Không gửi được/, true],
  ];
  for (const [status, text, retry] of cases) {
    await page.route('**/api/lead', (r) => (status === 'abort' ? r.abort() : r.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false }) })));
    await next.click();
    await expect(d.locator('.qc-result--err')).toContainText(text, { timeout: 20_000 });
    expect(await d.getByRole('button', { name: 'Thử lại' }).count() > 0).toBe(retry);
    if (status === 429 || status === 503 || status === 500 || status === 'abort') await expect(d.locator('.qc-result--err a[href^="mailto:"]')).toBeVisible();
    expect(await d.locator('.qc-result--ok').count()).toBe(0);
    await page.unroute('**/api/lead');
    // go back one step and forward again so the next case starts from a clean error state
    await d.locator('.stepper__button--back').click();
    await next.click();
  }
  expect(d1("SELECT id FROM leads WHERE contact = 'loi.thu@example.com'")).toHaveLength(0);
});

test('retry after a failure re-uses the same requestId (so a lost response never creates a duplicate)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  const ids: string[] = [];
  await page.route('**/api/lead', async (route) => {
    ids.push(JSON.parse(route.request().postData() || '{}').requestId);
    if (ids.length === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' });
    return route.continue();
  });
  resetRate();
  const { d, next } = await fillAndSubmit(page, 'retry.thu@example.com');
  await next.click();
  await expect(d.locator('.qc-result--err')).toBeVisible({ timeout: 20_000 });
  await d.getByRole('button', { name: 'Thử lại' }).click();
  await expect(d.locator('.qc-result--ok')).toBeVisible({ timeout: 20_000 });
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
  expect(d1("SELECT id FROM leads WHERE contact = 'retry.thu@example.com'")).toHaveLength(1);
});

test('videos come from R2 through the Function: Range 206, immutable cache, lightbox plays, posters stay static', async ({ page, request, baseURL }) => {
  const manifest = await (await request.get(`${baseURL}/`)).text();
  expect(manifest).not.toContain('/Users/');
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  await scrollToId(page, 'work');
  const key = await page.evaluate(() => (document.querySelector('#work .vcard') as HTMLElement).dataset.videoSrc!);
  expect(key).toMatch(/^\/media\/v2\/gallery\/gallery-v01-720\.[0-9a-f]{8}\.mp4$/);
  const head = await request.head(`${baseURL}${key}`);
  expect(head.status()).toBe(200);
  expect(head.headers()['content-type']).toBe('video/mp4');
  expect(head.headers()['cache-control']).toContain('immutable');
  expect(head.headers()['accept-ranges']).toBe('bytes');
  const part = await request.get(`${baseURL}${key}`, { headers: { Range: 'bytes=0-1023' } });
  expect(part.status()).toBe(206);
  expect(part.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
  expect((await part.body()).length).toBe(1024);
  expect((await request.get(`${baseURL}${key}`, { headers: { Range: 'bytes=99999999999-' } })).status()).toBe(416);
  // a missing video is a real 404 (not the home page with 200), and the small preview clips still come from static assets
  const missing = await request.get(`${baseURL}/media/v2/gallery/missing.00000000.mp4`);
  expect(missing.status()).toBe(404);
  expect(missing.headers()['content-type'] ?? '').not.toContain('video');
  const prev = await page.evaluate(() => (document.querySelector('#work .vcard') as HTMLElement).dataset.previewSrc!);
  const pv = await request.get(`${baseURL}${prev}`);
  expect(pv.status()).toBe(200);
  expect(pv.headers()['content-type']).toBe('video/mp4');
  // the browser plays it end-to-end from the Function
  await page.locator('#work .vcard').first().click();
  await expect(dialog(page)).toBeVisible();
  const video = page.locator('#dfl-video');
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState >= 2 && v.currentTime > 0.3 && !v.paused), { timeout: 30_000 }).toBe(true);
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentSrc)).toContain(key);
  // posters/previews are served as static assets (no Function, no R2)
  const poster = await page.evaluate(() => (document.querySelector('#work img') as HTMLImageElement).src);
  const pr = await request.get(poster);
  expect(pr.status()).toBe(200);
  expect(pr.headers()['content-type']).toContain('image/webp');
});

test('security headers are served; CSP (report-only) names the real inline-script hashes', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/`);
  const h = res.headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
  expect(h['x-frame-options']).toBe('DENY');
  const csp = h['content-security-policy-report-only'];
  expect(csp).toContain("object-src 'none'");
  const html = await res.text();
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((t) => t.trim());
  expect(inline.length).toBeGreaterThan(0);
  const { createHash } = await import('node:crypto');
  for (const code of inline) expect(csp).toContain(`'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`);
  const asset = html.match(/\/_astro\/[^"']+\.js/)![0];
  expect((await request.get(`${baseURL}${asset}`)).headers()['cache-control']).toContain('immutable');
});

test('CSP report-only: a full tour (scroll, hover previews, lightbox, Social video, Quick Call, Lanyard/WebGL) causes no violations', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ← ${e.blockedURI}`));
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  await page.waitForTimeout(2500); // Dot Grid + Lanyard
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(80);
  }
  await scrollToId(page, 'work');
  await page.locator('#work .vcard').nth(1).hover();
  await page.waitForTimeout(1500);
  await page.mouse.move(5, 5);
  await page.locator('#work .vcard').first().click();
  await expect(dialog(page)).toBeVisible();
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');
  await scrollToId(page, 'process');
  await page.waitForFunction(() => document.querySelectorAll('#process .folder-root').length === 4);
  await page.locator('#process .folder-stage').first().click();
  await page.waitForTimeout(800);
  await page.locator('.hdr__cta').click();
  await expect(dialog(page).locator('.qc')).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
});
