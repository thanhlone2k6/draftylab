#!/usr/bin/env node
// Upload the full-size videos that `prepare-dist` moved out of dist/ (dist-r2/) to an R2 bucket.
//
//   node scripts/upload-media.mjs                       → DRY RUN (default): lists keys, sizes, sha256. Touches nothing.
//   node scripts/upload-media.mjs --execute --local     → uploads to wrangler's LOCAL R2 simulation (safe, on disk)
//   node scripts/upload-media.mjs --execute --remote --bucket <name> --confirm-bucket <name>
//                                                      → real upload (step 3C only, after explicit approval)
//
// Object keys = path under dist-r2/ (== path under /media/v2/), content-hashed, so re-uploading identical content is
// harmless and a changed file can never be served under an old key. The bucket must be the NEW V2 bucket — the V1
// bucket name is refused.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { WEBSITE_DIR } from './lib/config.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };

const dir = path.resolve(WEBSITE_DIR, opt('dir', 'dist-r2'));
const bucket = opt('bucket', 'draft2');
const execute = flag('execute');
const remote = flag('remote');
const local = flag('local');
const FORBIDDEN = new Set(['draftylab-media']); // V1's bucket

if (FORBIDDEN.has(bucket)) { console.error(`Refusing: "${bucket}" is the V1 bucket.`); process.exit(2); }
if (execute && remote === local) { console.error('With --execute choose exactly one of --local or --remote.'); process.exit(2); }
if (execute && remote && opt('confirm-bucket') !== bucket) { console.error('Remote upload needs --confirm-bucket <same name as --bucket>.'); process.exit(2); }

async function* walk(d) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const sha = (f) => new Promise((res, rej) => { const h = crypto.createHash('sha256'); const s = fs.open(f).then((fh) => { const st = fh.createReadStream(); st.on('data', (c) => h.update(c)); st.on('end', () => { fh.close(); res(h.digest('hex')); }); st.on('error', rej); }); s.catch(rej); });

let files = [];
try { for await (const f of walk(dir)) if (f.endsWith('.mp4')) files.push(f); } catch { console.error(`Nothing at ${dir}. Run: npm run build:deploy`); process.exit(1); }
files.sort();

const rows = [];
let total = 0;
for (const f of files) {
  const key = path.relative(dir, f).split(path.sep).join('/');
  const { size } = await fs.stat(f);
  total += size;
  rows.push({ key, size, sha256: await sha(f), ok: /^[a-zA-Z0-9_\-./]+-720\.[0-9a-f]{8}\.mp4$/.test(key) });
}
const bad = rows.filter((r) => !r.ok);
console.log(`${execute ? 'UPLOAD' : 'DRY RUN'} — ${rows.length} objects, ${(total / 1048576).toFixed(1)} MB → bucket "${bucket}" (${execute ? (remote ? 'REMOTE' : 'local simulation') : 'nothing will be sent'})`);
for (const r of rows) console.log(`${(r.size / 1048576).toFixed(1).padStart(7)} MB  ${r.sha256.slice(0, 12)}  ${r.key}${r.ok ? '' : '   ← unexpected key'}`);
await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ bucket, generatedAt: new Date().toISOString(), objects: rows }, null, 2));
if (bad.length) { console.error(`${bad.length} object(s) with an unexpected key — aborting.`); process.exit(1); }
if (!execute) { console.log('\nDry run only. Nothing was uploaded.'); process.exit(0); }

let failed = 0;
for (const r of rows) {
  const res = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/${r.key}`, '--file', path.join(dir, r.key), '--content-type', 'video/mp4', remote ? '--remote' : '--local'], { stdio: 'pipe', encoding: 'utf8', cwd: WEBSITE_DIR });
  if (res.status !== 0) { failed++; console.error(`FAILED ${r.key}\n${res.stderr || res.stdout}`); } else console.log('uploaded', r.key);
}
process.exit(failed ? 1 : 0);
