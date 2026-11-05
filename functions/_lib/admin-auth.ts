// Login of the /admin page: a one-time 6-digit code emailed to the owner's Gmail (recipient fixed on the server,
// nobody can ask for it to go elsewhere), then an HttpOnly session cookie.
// Limits: code valid 10 min, 5 tries per code, 5 wrong codes per IP in 15 min, and 20 wrong codes overall in 1 hour
// lock the login and alert the owner by email (an attacker can rotate IPs, so the per-IP limit alone is not enough).
import type { Env } from './env';
import { formatVN } from './notify';

export const AUTH = {
  codeTtlS: 600,
  maxCodeAttempts: 5,
  sendCooldownS: 60,
  maxSendsPerHour: 6,
  ipFailMax: 5,
  ipFailWindowS: 900,
  globalFailMax: 20,
  globalFailWindowS: 3600,
  rememberTtlS: 90 * 86400, // "remember this device"
  shortTtlS: 12 * 3600, // a borrowed or shared computer
} as const;

export interface AuthDeps {
  fetch: typeof fetch;
  now: () => number; // ms
  waitUntil: (p: Promise<unknown>) => void;
}

export const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });

const hex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))].map((b) => b.toString(16).padStart(2, '0')).join('');

export const sha256Hex = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Uniform 6-digit code; rejection sampling avoids modulo bias. */
function newCode(): string {
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= 4_294_000_000);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

export function originAllowed(request: Request): boolean {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

const isLocalhost = (request: Request) => ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname);

async function ipHash(request: Request, env: Env): Promise<string> {
  return (await sha256Hex(`${env.RATE_SALT}|${request.headers.get('CF-Connecting-IP') || 'unknown'}`)).slice(0, 32);
}

async function countEvents(env: Env, kind: string, since: number, ip?: string): Promise<number> {
  const row = ip
    ? await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_auth_events WHERE kind = ? AND ts > ? AND ip_hash = ?').bind(kind, since, ip).first<{ n: number }>()
    : await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_auth_events WHERE kind = ? AND ts > ?').bind(kind, since).first<{ n: number }>();
  return row?.n ?? 0;
}

const addEvent = (env: Env, kind: string, ip: string, nowS: number) =>
  env.DB.batch([
    env.DB.prepare('INSERT INTO admin_auth_events (kind, ip_hash, ts) VALUES (?, ?, ?)').bind(kind, ip, nowS),
    env.DB.prepare('DELETE FROM admin_auth_events WHERE ts < ?').bind(nowS - 86400),
  ]);

async function sendEmail(request: Request, env: Env, deps: AuthDeps, subject: string, text: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    // Local development only: there is no mail key on localhost, so the message goes to the terminal.
    if (!isLocalhost(request)) return false;
    console.log(`[dev email] ${subject}\n${text}`);
    return true;
  }
  if (!env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) return false;
  try {
    const res = await deps.fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.LEAD_FROM_EMAIL, to: [env.LEAD_TO_EMAIL], subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function isLocked(env: Env, nowS: number, ip: string): Promise<boolean> {
  if ((await countEvents(env, 'fail', nowS - AUTH.globalFailWindowS)) >= AUTH.globalFailMax) return true;
  return (await countEvents(env, 'fail', nowS - AUTH.ipFailWindowS, ip)) >= AUTH.ipFailMax;
}

export async function requestCode(request: Request, env: Env, deps: AuthDeps): Promise<Response> {
  if (!env.RATE_SALT) return json(503, { ok: false, code: 'not_configured' });
  const nowS = Math.floor(deps.now() / 1000);
  const ip = await ipHash(request, env);
  if (await isLocked(env, nowS, ip)) return json(429, { ok: false, code: 'locked' });

  // Counted before sending, so nobody can use this button to flood the inbox.
  const lastHour = await env.DB.prepare('SELECT COUNT(*) AS n, MAX(ts) AS last FROM admin_auth_events WHERE kind = ? AND ts > ?')
    .bind('send', nowS - 3600)
    .first<{ n: number; last: number | null }>();
  if (lastHour?.last && nowS - lastHour.last < AUTH.sendCooldownS) {
    return json(429, { ok: false, code: 'cooldown', retryAfter: AUTH.sendCooldownS - (nowS - lastHour.last) });
  }
  if ((lastHour?.n ?? 0) >= AUTH.maxSendsPerHour) return json(429, { ok: false, code: 'too_many' });
  await addEvent(env, 'send', ip, nowS);

  const code = newCode();
  const id = crypto.randomUUID();
  // A new code replaces any earlier one.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_login_codes'),
    env.DB.prepare('INSERT INTO admin_login_codes (id, code_hash, attempts, expires_at) VALUES (?, ?, 0, ?)').bind(
      id,
      await hmacHex(env.RATE_SALT, `${id}|${code}`),
      nowS + AUTH.codeTtlS,
    ),
  ]);

  const sent = await sendEmail(
    request,
    env,
    deps,
    '[Drafty Lab] Mã đăng nhập trang quản trị',
    `Mã đăng nhập của bạn: ${code}\n\nMã có hiệu lực trong 10 phút và chỉ dùng được một lần.\nNếu không phải bạn vừa yêu cầu, chỉ cần bỏ qua email này — không ai vào được khi không có mã.`,
  );
  if (!sent) {
    await env.DB.prepare('DELETE FROM admin_login_codes WHERE id = ?').bind(id).run();
    return json(502, { ok: false, code: 'email_failed' });
  }
  return json(200, { ok: true });
}

export async function verifyCode(request: Request, env: Env, deps: AuthDeps): Promise<Response> {
  if (!env.RATE_SALT) return json(503, { ok: false, code: 'not_configured' });
  const nowS = Math.floor(deps.now() / 1000);
  const ip = await ipHash(request, env);
  if (await isLocked(env, nowS, ip)) return json(429, { ok: false, code: 'locked' });

  let code: unknown;
  let remember = false;
  try {
    const body = (await request.json()) as { code?: unknown; remember?: unknown };
    code = body.code;
    remember = body.remember === true;
  } catch {
    return json(400, { ok: false, code: 'bad_json' });
  }

  const fail = async (): Promise<Response> => {
    await addEvent(env, 'fail', ip, nowS);
    const total = await countEvents(env, 'fail', nowS - AUTH.globalFailWindowS);
    if (total === AUTH.globalFailMax) {
      deps.waitUntil(
        sendEmail(
          request,
          env,
          deps,
          '[Drafty Lab] Cảnh báo: trang quản trị đã tạm khoá',
          `Có ${total} lần nhập sai mã đăng nhập trong 1 giờ, nên đăng nhập đã tạm khoá 1 giờ. Bài đăng của bạn không bị ảnh hưởng.\nNếu không phải bạn nhập sai, có thể ai đó đang dò mã.`,
        ),
      );
    }
    return json(401, { ok: false, code: 'wrong' });
  };

  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return fail();

  const live = await env.DB.prepare('SELECT id, code_hash FROM admin_login_codes WHERE expires_at > ? LIMIT 1').bind(nowS).first<{ id: string; code_hash: string }>();
  if (!live) return fail();

  // Atomic, so parallel guesses cannot get more than the allowed tries.
  const claimed = await env.DB.prepare('UPDATE admin_login_codes SET attempts = attempts + 1 WHERE id = ? AND attempts < ? RETURNING attempts')
    .bind(live.id, AUTH.maxCodeAttempts)
    .first<{ attempts: number }>();
  if (!claimed) {
    await env.DB.prepare('DELETE FROM admin_login_codes WHERE id = ?').bind(live.id).run();
    return fail();
  }

  if (!constantTimeEqual(await hmacHex(env.RATE_SALT, `${live.id}|${code}`), live.code_hash)) {
    if (claimed.attempts >= AUTH.maxCodeAttempts) await env.DB.prepare('DELETE FROM admin_login_codes WHERE id = ?').bind(live.id).run();
    return fail();
  }

  // Single use: only the request that actually deletes the code gets a session.
  const used = await env.DB.prepare('DELETE FROM admin_login_codes WHERE id = ? RETURNING id').bind(live.id).first();
  if (!used) return fail();

  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const ttl = remember ? AUTH.rememberTtlS : AUTH.shortTtlS;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').bind(nowS),
    env.DB.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').bind(await sha256Hex(token), nowS + ttl),
  ]);
  // Every new sign-in tells the owner, so a stolen Gmail or code cannot be used silently.
  const device = (request.headers.get('User-Agent') || 'không rõ').replace(LINE_BREAKS, ' ').slice(0, 200);
  deps.waitUntil(
    sendEmail(
      request,
      env,
      deps,
      '[Drafty Lab] Có thiết bị vừa đăng nhập trang quản trị',
      `Thời gian: ${formatVN(deps.now())}\nThiết bị: ${device}\n\nNếu không phải bạn: đổi mật khẩu Gmail, vào trang quản trị và bấm "Đăng xuất tất cả thiết bị".`,
    ),
  );
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(request, token, ttl) });
}

const LINE_BREAKS = new RegExp('[\\r\\n\\u2028\\u2029]+', 'g');

// `__Host-` needs https; plain http only exists on localhost.
const cookieName = (request: Request) => (new URL(request.url).protocol === 'https:' ? '__Host-dfl_admin' : 'dfl_admin');

function sessionCookie(request: Request, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${cookieName(request)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function readToken(request: Request): string | null {
  const name = cookieName(request);
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name && v && /^[0-9a-f]{64}$/.test(v)) return v;
  }
  return null;
}

export async function isAdmin(request: Request, env: Env, nowMs: number): Promise<boolean> {
  const token = readToken(request);
  if (!token) return false;
  const row = await env.DB.prepare('SELECT 1 AS ok FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await sha256Hex(token), Math.floor(nowMs / 1000))
    .first();
  return !!row;
}

export async function countDevices(env: Env, nowMs: number): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_sessions WHERE expires_at > ?').bind(Math.floor(nowMs / 1000)).first<{ n: number }>();
  return row?.n ?? 0;
}

/** Emergency button: every device has to sign in again with a new Gmail code, including this one. */
export async function revokeAllDevices(request: Request, env: Env): Promise<Response> {
  await env.DB.batch([env.DB.prepare('DELETE FROM admin_sessions'), env.DB.prepare('DELETE FROM admin_login_codes')]);
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(request, '', 0) });
}

export async function logout(request: Request, env: Env): Promise<Response> {
  const token = readToken(request);
  if (token) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(request, '', 0) });
}
