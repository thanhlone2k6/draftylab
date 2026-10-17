import type { Env } from '../../_lib/env';
import { handleMedia } from '../../_lib/media-handler';

export const onRequest: PagesFunction<Env> = (ctx) => {
  const p = ctx.params.path;
  const path = Array.isArray(p) ? p.join('/') : String(p ?? '');
  return handleMedia({ request: ctx.request, env: ctx.env, path, next: () => ctx.next() });
};
