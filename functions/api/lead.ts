import type { Env } from '../_lib/env';
import { handleLead } from '../_lib/lead-handler';

export const onRequest: PagesFunction<Env> = (ctx) =>
  handleLead(ctx.request, ctx.env, {
    fetch: (...a) => fetch(...a),
    now: () => Date.now(),
    waitUntil: (p) => ctx.waitUntil(p),
    randomId: () => crypto.randomUUID().replace(/-/g, '').slice(0, 20),
  });
