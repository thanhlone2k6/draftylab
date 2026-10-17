// GET/HEAD /media/v2/**/*.mp4 → R2 object (same origin, Range-capable). Anything that is not an .mp4 is passed
// through to the static assets (posters, previews, images stay in the Pages deployment).
import type { Env } from './env';

const SAFE_PATH = /^[a-zA-Z0-9_\-./]+$/;
const HASHED = /\.[0-9a-f]{8}\.mp4$/; // content-hashed names are immutable

export interface MediaCtx {
  request: Request;
  env: Env;
  path: string; // path after /media/v2/
  next: () => Promise<Response>;
}

function baseHeaders(object: R2Object, key: string): Headers {
  const h = new Headers();
  object.writeHttpMetadata?.(h);
  h.set('Content-Type', 'video/mp4');
  h.set('ETag', object.httpEtag ?? object.etag);
  h.set('Accept-Ranges', 'bytes');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Cache-Control', HASHED.test(key) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
  return h;
}

/** Parse a single `bytes=a-b` / `bytes=a-` / `bytes=-n` range against a known size. */
export function parseRange(header: string | null, size: number): { start: number; end: number } | 'unsatisfiable' | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null; // malformed → ignore, serve whole file
  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  const end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}

export async function handleMedia({ request, env, path, next }: MediaCtx): Promise<Response> {
  const method = request.method.toUpperCase();
  if (!path.toLowerCase().endsWith('.mp4')) return next();
  if (method !== 'GET' && method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const key = path.replace(/^\/+/, '');
  if (!key || key.includes('..') || !SAFE_PATH.test(key)) return new Response('Not Found', { status: 404 });

  try {
    const head = await env.MEDIA_BUCKET.head(key);
    // Not in R2 → hand over to the static assets: the small hover-preview clips are deployed with the site (not in
    // the bucket), and a truly missing file still ends in the platform's 404.
    if (!head) return next();
    const headers = baseHeaders(head, key);
    const inm = request.headers.get('If-None-Match');
    if (inm && inm === (head.httpEtag ?? head.etag)) return new Response(null, { status: 304, headers });

    const range = parseRange(request.headers.get('Range'), head.size);
    if (range === 'unsatisfiable') return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${head.size}` } });

    if (method === 'HEAD') {
      headers.set('Content-Length', String(head.size));
      return new Response(null, { status: 200, headers });
    }
    if (range) {
      const length = range.end - range.start + 1;
      const obj = await env.MEDIA_BUCKET.get(key, { range: { offset: range.start, length } });
      if (!obj || !('body' in obj) || !obj.body) return new Response('Not Found', { status: 404 });
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${head.size}`);
      headers.set('Content-Length', String(length));
      return new Response(obj.body, { status: 206, headers });
    }
    const obj = await env.MEDIA_BUCKET.get(key);
    if (!obj || !('body' in obj) || !obj.body) return new Response('Not Found', { status: 404 });
    headers.set('Content-Length', String(head.size));
    return new Response(obj.body, { status: 200, headers });
  } catch (e) {
    console.error('media_error', e instanceof Error ? e.name : 'unknown');
    return new Response('Internal Server Error', { status: 500 });
  }
}
