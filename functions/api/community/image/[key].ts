import type { Env } from '../../../_lib/env';
import { handleImage } from '../../../_lib/community';

export const onRequest: PagesFunction<Env> = (ctx) => handleImage(ctx.request, ctx.env, String(ctx.params.key));
