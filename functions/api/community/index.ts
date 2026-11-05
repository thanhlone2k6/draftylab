import type { Env } from '../../_lib/env';
import { json } from '../../_lib/admin-auth';
import { handlePublicList } from '../../_lib/community';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    return await handlePublicList(ctx.env);
  } catch {
    return json(500, { ok: false, code: 'server' });
  }
};
