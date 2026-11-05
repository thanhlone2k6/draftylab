// Community tab. Public: the 3 newest published posts and their images. Admin: create / edit / hide / delete.
// Post content is shown exactly as the owner typed it in every language; only the page's own labels are translated.
import type { Env } from './env';
import { countDevices, isAdmin, json, logout, originAllowed, requestCode, revokeAllDevices, verifyCode, type AuthDeps } from './admin-auth';

export const PUBLIC_LIMIT = 3;
export const PUBLIC_ALL_LIMIT = 200;
export const LIMITS = { title: 120, description: 300, url: 2048, imageBytes: 3 * 1024 * 1024, adminList: 500 } as const;

const IMAGE_KEY = /^[0-9a-f]{32}\.(webp|jpg|png)$/;
const MIME: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' };
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f\\u2028\\u2029]+", "g");

interface PostRow {
  id: string;
  title: string;
  description: string;
  url: string;
  image_key: string;
  status: string;
  created_at: number;
  updated_at: number;
  sort_order: number | null;
}

/** Same columns as a post, minus the posting date; `image_key` may be '' when there is no cover. */
interface SkillRow {
  id: string;
  title: string;
  description: string;
  url: string;
  image_key: string;
  status: string;
  sort_order: number | null;
  created_at: number;
  updated_at: number;
}

const imageUrl = (key: string) => `/api/community/image/${key}`;
const cleanText = (v: string, max: number) => v.replace(CONTROL_CHARS, ' ').trim().slice(0, max);

const MIN_POST_DATE = Date.UTC(2000, 0, 1);
/**
 * Posting date picked in /admin (unix milliseconds). `undefined` = field not sent (keep the current
 * value), `null` = malformed. Noon local time on the client keeps the calendar day stable elsewhere.
 */
export function parsePostDate(value: string | null): number | null | undefined {
  if (value === null || value.trim() === '') return undefined;
  const v = value.trim();
  if (!/^\d{12,15}$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < MIN_POST_DATE || n > Date.now() + 10 * 365 * 86400000) return null;
  return n;
}

/** http(s) only: a `javascript:` link on a public card would run in the visitor's browser. */
export function cleanUrl(value: string): string | null {
  const v = value.trim();
  if (!v || v.length > LIMITS.url) return null;
  try {
    const u = new URL(v);
    if ((u.protocol !== 'https:' && u.protocol !== 'http:') || u.username || u.password) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Trust the file's bytes, never its name or declared type (an SVG or HTML upload could carry a script). */
export function sniffImage(b: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return 'png';
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Manual order first (higher = earlier); posts never dragged keep the newest-first default. */
const ORDER = 'ORDER BY COALESCE(sort_order, created_at) DESC, created_at DESC';

export async function handlePublicList(env: Env, limit = PUBLIC_LIMIT): Promise<Response> {
  const take = Math.min(PUBLIC_ALL_LIMIT, Math.max(1, Math.round(limit) || PUBLIC_LIMIT));
  const { results } = await env.DB.prepare(
    `SELECT id, title, description, url, image_key, created_at FROM community_posts WHERE status = 'published' ${ORDER} LIMIT ?`,
  )
    .bind(take)
    .all<Pick<PostRow, 'id' | 'title' | 'description' | 'url' | 'image_key' | 'created_at'>>();
  const items = results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    image: imageUrl(r.image_key),
    createdAt: r.created_at, // the card shows the posting date (owner, 2026-11-05)
  }));
  return json(200, { ok: true, items }, { 'Cache-Control': 'public, max-age=15' });
}

/** The "Skill AI x Claude" shelf above the posts: every published skill, in the owner's order. */
export async function handlePublicSkills(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT id, title, description, url, image_key FROM community_skills WHERE status = 'published' ${ORDER} LIMIT ?`,
  )
    .bind(PUBLIC_ALL_LIMIT)
    .all<Pick<SkillRow, 'id' | 'title' | 'description' | 'url' | 'image_key'>>();
  const items = results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    image: r.image_key ? imageUrl(r.image_key) : null,
  }));
  return json(200, { ok: true, items }, { 'Cache-Control': 'public, max-age=15' });
}

export async function handleImage(request: Request, env: Env, key: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  if (!IMAGE_KEY.test(key)) return new Response('Not Found', { status: 404 });
  const object = await env.MEDIA_BUCKET.get(`community/${key}`);
  if (!object) return new Response('Not Found', { status: 404 });
  const ext = key.split('.').pop() as string;
  return new Response(request.method === 'HEAD' ? null : object.body, {
    headers: {
      'Content-Type': MIME[ext],
      'Cache-Control': 'public, max-age=31536000, immutable', // every upload gets a new random name
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

async function storeImage(env: Env, file: File): Promise<{ key: string } | Response> {
  if (file.size > LIMITS.imageBytes) return json(413, { ok: false, code: 'image_too_large' });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext) return json(400, { ok: false, code: 'image_type' });
  const key = `${[...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('')}.${ext}`;
  await env.MEDIA_BUCKET.put(`community/${key}`, bytes, { httpMetadata: { contentType: MIME[ext] } });
  return { key };
}

const dropImage = (env: Env, key: string) => (IMAGE_KEY.test(key) ? env.MEDIA_BUCKET.delete(`community/${key}`) : Promise.resolve());

const toAdminPost = (r: PostRow) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  url: r.url,
  image: imageUrl(r.image_key),
  status: r.status,
  createdAt: r.created_at,
  sortOrder: r.sort_order,
});

const toAdminSkill = (r: SkillRow) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  url: r.url,
  image: r.image_key ? imageUrl(r.image_key) : null,
  status: r.status,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

async function readForm(request: Request): Promise<FormData | Response> {
  if (Number(request.headers.get('Content-Length') || 0) > LIMITS.imageBytes + 64 * 1024) return json(413, { ok: false, code: 'image_too_large' });
  try {
    return await request.formData();
  } catch {
    return json(400, { ok: false, code: 'bad_form' });
  }
}

const fileOf = (form: FormData, name: string): File | null => {
  const v = form.get(name) as unknown;
  return typeof v === 'object' && v !== null && (v as File).size > 0 ? (v as File) : null;
};
const textOf = (form: FormData, name: string): string | null => {
  const v = form.get(name) as unknown;
  return typeof v === 'string' ? v : null;
};

async function createPost(request: Request, env: Env, now: number): Promise<Response> {
  const form = await readForm(request);
  if (form instanceof Response) return form;
  const title = cleanText(textOf(form, 'title') ?? '', LIMITS.title);
  const description = cleanText(textOf(form, 'description') ?? '', LIMITS.description);
  const url = cleanUrl(textOf(form, 'url') ?? '');
  const file = fileOf(form, 'image');
  const rawDate = parsePostDate(textOf(form, 'createdAt'));
  if (!title) return json(400, { ok: false, code: 'title' });
  if (!url) return json(400, { ok: false, code: 'url' });
  if (!file) return json(400, { ok: false, code: 'image' });
  if (rawDate === null) return json(400, { ok: false, code: 'date' });
  const createdAt = rawDate ?? now;

  const stored = await storeImage(env, file);
  if (stored instanceof Response) return stored;
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  try {
    await env.DB.prepare(
      "INSERT INTO community_posts (id, title, description, url, image_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'published', ?, ?)",
    )
      .bind(id, title, description, url, stored.key, createdAt, now)
      .run();
  } catch (e) {
    await dropImage(env, stored.key);
    throw e;
  }
  return json(201, { ok: true, id });
}

async function updatePost(request: Request, env: Env, id: string, now: number): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM community_posts WHERE id = ?').bind(id).first<PostRow>();
  if (!row) return json(404, { ok: false, code: 'not_found' });
  const form = await readForm(request);
  if (form instanceof Response) return form;

  const rawTitle = textOf(form, 'title');
  const rawDescription = textOf(form, 'description');
  const rawUrl = textOf(form, 'url');
  const rawStatus = textOf(form, 'status');
  const title = rawTitle === null ? row.title : cleanText(rawTitle, LIMITS.title);
  const description = rawDescription === null ? row.description : cleanText(rawDescription, LIMITS.description);
  const url = rawUrl === null ? row.url : cleanUrl(rawUrl);
  const status = rawStatus ?? row.status;
  const rawDate = parsePostDate(textOf(form, 'createdAt'));
  if (!title) return json(400, { ok: false, code: 'title' });
  if (!url) return json(400, { ok: false, code: 'url' });
  if (status !== 'published' && status !== 'hidden') return json(400, { ok: false, code: 'status' });
  if (rawDate === null) return json(400, { ok: false, code: 'date' });
  const createdAt = rawDate ?? row.created_at;

  let imageKey = row.image_key;
  const file = fileOf(form, 'image');
  if (file) {
    const stored = await storeImage(env, file);
    if (stored instanceof Response) return stored;
    imageKey = stored.key;
  }
  await env.DB.prepare('UPDATE community_posts SET title = ?, description = ?, url = ?, image_key = ?, status = ?, created_at = ?, updated_at = ? WHERE id = ?')
    .bind(title, description, url, imageKey, status, createdAt, now, id)
    .run();
  if (imageKey !== row.image_key) await dropImage(env, row.image_key);
  return json(200, { ok: true });
}

/** /admin drag & drop: the ids arrive in the order the owner wants, first row first. */
async function reorderRows(request: Request, env: Env, table: 'community_posts' | 'community_skills'): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, code: 'bad_json' });
  }
  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length > LIMITS.adminList) return json(400, { ok: false, code: 'ids' });
  if (!ids.every((id) => typeof id === 'string' && /^[a-f0-9]{20}$/.test(id))) return json(400, { ok: false, code: 'ids' });
  if (new Set(ids).size !== ids.length) return json(400, { ok: false, code: 'ids' });
  if (ids.length) {
    // Higher value = earlier row. Newly created rows stay NULL and sort on top by created_at.
    const stmt = env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
    await env.DB.batch(ids.map((id, index) => stmt.bind((ids.length - index) * 1000, id)));
  }
  return json(200, { ok: true });
}

const reorderPosts = (request: Request, env: Env) => reorderRows(request, env, 'community_posts');
const reorderSkills = (request: Request, env: Env) => reorderRows(request, env, 'community_skills');

async function deletePost(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare('DELETE FROM community_posts WHERE id = ? RETURNING image_key').bind(id).first<{ image_key: string }>();
  if (!row) return json(404, { ok: false, code: 'not_found' });
  await dropImage(env, row.image_key);
  return json(200, { ok: true });
}

async function createSkill(request: Request, env: Env, now: number): Promise<Response> {
  const form = await readForm(request);
  if (form instanceof Response) return form;
  const title = cleanText(textOf(form, 'title') ?? '', LIMITS.title);
  const description = cleanText(textOf(form, 'description') ?? '', LIMITS.description);
  const url = cleanUrl(textOf(form, 'url') ?? '');
  if (!title) return json(400, { ok: false, code: 'title' });
  if (!url) return json(400, { ok: false, code: 'url' });

  let imageKey = '';
  const file = fileOf(form, 'image');
  if (file) {
    const stored = await storeImage(env, file);
    if (stored instanceof Response) return stored;
    imageKey = stored.key;
  }
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  try {
    await env.DB.prepare(
      "INSERT INTO community_skills (id, title, description, url, image_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'published', ?, ?)",
    )
      .bind(id, title, description, url, imageKey, now, now)
      .run();
  } catch (e) {
    await dropImage(env, imageKey);
    throw e;
  }
  return json(201, { ok: true, id });
}

async function updateSkill(request: Request, env: Env, id: string, now: number): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM community_skills WHERE id = ?').bind(id).first<SkillRow>();
  if (!row) return json(404, { ok: false, code: 'not_found' });
  const form = await readForm(request);
  if (form instanceof Response) return form;

  const rawTitle = textOf(form, 'title');
  const rawDescription = textOf(form, 'description');
  const rawUrl = textOf(form, 'url');
  const rawStatus = textOf(form, 'status');
  const title = rawTitle === null ? row.title : cleanText(rawTitle, LIMITS.title);
  const description = rawDescription === null ? row.description : cleanText(rawDescription, LIMITS.description);
  const url = rawUrl === null ? row.url : cleanUrl(rawUrl);
  const status = rawStatus ?? row.status;
  if (!title) return json(400, { ok: false, code: 'title' });
  if (!url) return json(400, { ok: false, code: 'url' });
  if (status !== 'published' && status !== 'hidden') return json(400, { ok: false, code: 'status' });

  let imageKey = row.image_key;
  const file = fileOf(form, 'image');
  if (file) {
    const stored = await storeImage(env, file);
    if (stored instanceof Response) return stored;
    imageKey = stored.key;
  }
  await env.DB.prepare('UPDATE community_skills SET title = ?, description = ?, url = ?, image_key = ?, status = ?, updated_at = ? WHERE id = ?')
    .bind(title, description, url, imageKey, status, now, id)
    .run();
  if (imageKey !== row.image_key) await dropImage(env, row.image_key);
  return json(200, { ok: true });
}

async function deleteSkill(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare('DELETE FROM community_skills WHERE id = ? RETURNING image_key').bind(id).first<{ image_key: string }>();
  if (!row) return json(404, { ok: false, code: 'not_found' });
  await dropImage(env, row.image_key);
  return json(200, { ok: true });
}

/** /api/admin/** — `segments` is the path after /api/admin/. */
export async function handleAdmin(request: Request, env: Env, deps: AuthDeps, segments: string[]): Promise<Response> {
  // Switched on only in production; preview deployments share the real database and must not be able to change it.
  if (env.ADMIN_ENABLED !== 'true') return json(404, { ok: false, code: 'not_found' });

  const method = request.method.toUpperCase();
  const path = segments.join('/');
  if (method !== 'GET' && !originAllowed(request)) return json(403, { ok: false, code: 'origin' });

  if (path === 'login/request' && method === 'POST') return requestCode(request, env, deps);
  if (path === 'login/verify' && method === 'POST') return verifyCode(request, env, deps);

  const authed = await isAdmin(request, env, deps.now());
  if (path === 'session' && method === 'GET') return json(200, { ok: true, authed });
  if (!authed) return json(401, { ok: false, code: 'unauthorized' });

  if (path === 'logout' && method === 'POST') return logout(request, env);
  if (path === 'devices' && method === 'GET') return json(200, { ok: true, count: await countDevices(env, deps.now()) });
  if (path === 'devices/revoke-all' && method === 'POST') return revokeAllDevices(request, env);
  if (path === 'posts' && method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT * FROM community_posts ${ORDER} LIMIT ?`).bind(LIMITS.adminList).all<PostRow>();
    return json(200, { ok: true, items: results.map(toAdminPost), publicLimit: PUBLIC_LIMIT });
  }
  if (path === 'posts' && method === 'POST') return createPost(request, env, deps.now());
  if (path === 'posts/reorder' && method === 'POST') return reorderPosts(request, env);
  if (segments[0] === 'posts' && segments.length === 2) {
    if (method === 'POST') return updatePost(request, env, segments[1], deps.now());
    if (method === 'DELETE') return deletePost(env, segments[1]);
  }
  if (path === 'skills' && method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT * FROM community_skills ${ORDER} LIMIT ?`).bind(LIMITS.adminList).all<SkillRow>();
    return json(200, { ok: true, items: results.map(toAdminSkill) });
  }
  if (path === 'skills' && method === 'POST') return createSkill(request, env, deps.now());
  if (path === 'skills/reorder' && method === 'POST') return reorderSkills(request, env);
  if (segments[0] === 'skills' && segments.length === 2) {
    if (method === 'POST') return updateSkill(request, env, segments[1], deps.now());
    if (method === 'DELETE') return deleteSkill(env, segments[1]);
  }
  return json(404, { ok: false, code: 'not_found' });
}
