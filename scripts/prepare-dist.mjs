#!/usr/bin/env node
// Prepare dist/ for Cloudflare Pages (run AFTER `astro build`; this is `npm run build:deploy`):
//  1. Move the big 720p lightbox/inline videos OUT of dist (Pages limit: 25 MiB per file) into dist-r2/ — these are
//     uploaded to R2 and served by the /media/v2 Pages Function. Small hover previews stay in dist.
//  2. Write dist/_headers with a CSP built from the exact inline-script hashes found in dist/**/*.html.
//  3. Fail if any remaining file exceeds 25 MiB, or if local paths leaked (check-no-local-paths).
// Local `npm run build` / preview keep all media in dist — nothing here changes the source tree.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { WEBSITE_DIR } from './lib/config.mjs';

// DIST_DIR / R2_OUT_DIR let the local integration build (dist-lead) go through the exact same preparation.
const DIST = path.resolve(WEBSITE_DIR, process.env.DIST_DIR || 'dist');
const R2_OUT = path.resolve(WEBSITE_DIR, process.env.R2_OUT_DIR || 'dist-r2');
const LIMIT = 25 * 1024 * 1024;
const FULL_VIDEO = /-720\.[0-9a-f]{8}\.mp4$/;

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

await fs.rm(R2_OUT, { recursive: true, force: true });
let moved = 0;
let movedBytes = 0;
for await (const f of walk(DIST)) {
  if (!FULL_VIDEO.test(f)) continue;
  const rel = path.relative(path.join(DIST, 'media/v2'), f); // R2 object key == path under /media/v2/
  const dest = path.join(R2_OUT, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const { size } = await fs.stat(f);
  await fs.rename(f, dest);
  moved++;
  movedBytes += size;
}

// CSP: 'self' + exact hashes of every inline <script> in the built HTML.
const hashes = new Set();
for await (const f of walk(DIST)) {
  if (!f.endsWith('.html')) continue;
  const html = await fs.readFile(f, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (m[1].trim()) hashes.add(`'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  }
}
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
const tpl = await fs.readFile(path.join(WEBSITE_DIR, 'deploy/headers.template'), 'utf8');
await fs.writeFile(path.join(DIST, '_headers'), tpl.replaceAll('__CSP__', csp));

const tooBig = [];
let total = 0;
let count = 0;
for await (const f of walk(DIST)) {
  const { size } = await fs.stat(f);
  total += size;
  count++;
  if (size > LIMIT) tooBig.push(`${path.relative(DIST, f)} (${(size / 1048576).toFixed(1)} MB)`);
}
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`dist (deploy): ${count} files, ${mb(total)} MB · moved ${moved} full videos (${mb(movedBytes)} MB) to dist-r2/ for R2 · ${hashes.size} inline-script hashes in CSP`);
if (tooBig.length) {
  console.error('Files over the 25 MiB Pages limit:\n' + tooBig.join('\n'));
  process.exit(1);
}
