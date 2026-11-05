import type { Env } from '../../_lib/env';
import { json } from '../../_lib/admin-auth';
import { handleAdmin } from '../../_lib/community';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const path = ctx.params.path;
  const segments = Array.isArray(path) ? path : path ? [path] : [];
  try {
    return await handleAdmin(ctx.request, ctx.env, { fetch: (...a) => fetch(...a), now: () => Date.now(), waitUntil: (p) => ctx.waitUntil(p) }, segments);
  } catch {
    return json(500, { ok: false, code: 'server' });
  }
};
