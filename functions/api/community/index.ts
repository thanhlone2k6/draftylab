import type { Env } from '../../_lib/env';
import { json } from '../../_lib/admin-auth';
import { handlePublicList } from '../../_lib/community';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    // `?limit=all` feeds the "see all" grid; the default stays the 3-card teaser.
    const raw = new URL(ctx.request.url).searchParams.get('limit');
    if (raw === 'all') return await handlePublicList(ctx.env, Number.MAX_SAFE_INTEGER);
    const n = raw ? Number(raw) : NaN;
    return await handlePublicList(ctx.env, Number.isFinite(n) ? n : undefined);
  } catch {
    return json(500, { ok: false, code: 'server' });
  }
};
