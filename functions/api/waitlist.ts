import type { Env } from '../_lib/env';
import { handleWaitlistGet, handleWaitlistPost } from '../_lib/waitlist-handler';

export const onRequestGet: PagesFunction<Env> = (ctx) => handleWaitlistGet(ctx.env);

export const onRequestPost: PagesFunction<Env> = (ctx) =>
  handleWaitlistPost(ctx.request, ctx.env, {
    fetch: (...a) => fetch(...a),
    now: () => Date.now(),
    waitUntil: (p) => ctx.waitUntil(p),
    randomId: () => crypto.randomUUID().replace(/-/g, '').slice(0, 20),
  });
