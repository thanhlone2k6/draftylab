import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMedia, parseRange } from '../../functions/_lib/media-handler.ts';
import type { Env } from '../../functions/_lib/env.ts';

const DATA = new Uint8Array(1000).map((_, i) => i % 251);
const KEY = 'gallery/gallery-v01-720.0123abcd.mp4';

function bucket(): R2Bucket {
  const obj = (range?: { offset: number; length: number }) => ({
    size: DATA.length,
    etag: 'abc',
    httpEtag: '"abc"',
    writeHttpMetadata: () => undefined,
    body: new Response(range ? DATA.slice(range.offset, range.offset + range.length) : DATA).body,
  });
  return {
    head: async (k: string) => (k === KEY || k === 'x/old-name.mp4' ? obj() : null),
    get: async (k: string, o?: { range?: { offset: number; length: number } }) => (k === KEY || k === 'x/old-name.mp4' ? obj(o?.range) : null),
  } as unknown as R2Bucket;
}
const env = { MEDIA_BUCKET: bucket() } as Env;
const call = (path: string, init: RequestInit = {}) => {
  let nexted = false;
  const request = new Request(`https://site.example/media/v2/${path}`, init);
  return handleMedia({ request, env, path, next: async () => { nexted = true; return new Response('static'); } }).then((res) => ({ res, nexted }));
};
const bytes = async (r: Response) => new Uint8Array(await r.arrayBuffer());

test('parseRange covers open, bounded, suffix, malformed and unsatisfiable ranges', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=900-5000', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 });
  assert.equal(parseRange('bytes=1000-', 1000), 'unsatisfiable');
  assert.equal(parseRange('bytes=500-100', 1000), 'unsatisfiable');
  assert.equal(parseRange('bytes=-0', 1000), 'unsatisfiable');
  assert.equal(parseRange('garbage', 1000), null);
  assert.equal(parseRange(null, 1000), null);
});

test('non-mp4 paths pass through to the static assets', async () => {
  const { nexted } = await call('gallery/gallery-v01-poster.webp');
  assert.ok(nexted);
});

test('full GET: 200, video/mp4, accept-ranges, immutable cache for hashed names', async () => {
  const { res } = await call(KEY);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'video/mp4');
  assert.equal(res.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(res.headers.get('Content-Length'), '1000');
  assert.match(res.headers.get('Cache-Control')!, /immutable/);
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(await bytes(res), DATA);
});

test('Range → 206 with exact bytes and Content-Range (what Safari/iOS and seeking need)', async () => {
  const { res } = await call(KEY, { headers: { Range: 'bytes=100-199' } });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get('Content-Range'), 'bytes 100-199/1000');
  assert.equal(res.headers.get('Content-Length'), '100');
  assert.deepEqual(await bytes(res), DATA.slice(100, 200));
  const tail = await call(KEY, { headers: { Range: 'bytes=-10' } });
  assert.equal(tail.res.status, 206);
  assert.equal(tail.res.headers.get('Content-Range'), 'bytes 990-999/1000');
  const open = await call(KEY, { headers: { Range: 'bytes=0-' } });
  assert.equal(open.res.status, 206);
  assert.equal(open.res.headers.get('Content-Length'), '1000');
});

test('unsatisfiable range → 416 with bytes */size', async () => {
  const { res } = await call(KEY, { headers: { Range: 'bytes=5000-' } });
  assert.equal(res.status, 416);
  assert.equal(res.headers.get('Content-Range'), 'bytes */1000');
});

test('HEAD, ETag revalidation, missing object', async () => {
  const head = await call(KEY, { method: 'HEAD' });
  assert.equal(head.res.status, 200);
  assert.equal(head.res.headers.get('Content-Length'), '1000');
  assert.equal((await bytes(head.res)).length, 0);
  assert.equal((await call(KEY, { headers: { 'If-None-Match': '"abc"' } })).res.status, 304);
  // not in R2 → static assets get the request (hover-preview clips live in the deployment, not in the bucket)
  const missing = await call('gallery/gallery-v01-preview.796227a1.mp4');
  assert.ok(missing.nexted);
});

test('unhashed names get a short cache; bad paths and methods are refused', async () => {
  assert.match((await call('x/old-name.mp4')).res.headers.get('Cache-Control')!, /max-age=3600$/);
  assert.equal((await call('../secrets.mp4')).res.status, 404);
  assert.equal((await call('a/%2e%2e/b.mp4')).res.status, 404);
  assert.equal((await call('a b/c.mp4')).res.status, 404);
  assert.equal((await call(KEY, { method: 'POST' })).res.status, 405);
});
