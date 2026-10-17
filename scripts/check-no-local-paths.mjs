#!/usr/bin/env node
// Fail if the public manifest or the production build leaks machine paths or raw source names.
import fs from 'node:fs/promises';
import path from 'node:path';
import { WEBSITE_DIR, INTERNAL_MANIFEST } from './lib/config.mjs';

const PATTERNS = [/\/Users\//, /Documents\/DFL2/, /Dự án/, /Tôi có thể giúp/, /Social Production\//, /Cách tôi sẽ làm việc/, /sourcePath/, /sourceRel/];
let sourceNames = [];
try {
  const { items } = JSON.parse(await fs.readFile(INTERNAL_MANIFEST, 'utf8'));
  // Raw file names that are distinctive enough to detect (skip generic ones like "1.png").
  sourceNames = items.map((i) => i.fileName).filter((n) => n.length > 8 && /[^\x00-\x7F]|\s/.test(n));
} catch {
  /* no internal manifest (fresh clone) */
}

async function* walk(dir) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(html|js|mjs|css|json|txt|xml)$/.test(e.name)) yield p;
  }
}

const targets = [path.join(WEBSITE_DIR, 'src/data/media.public.json')];
for await (const f of walk(path.join(WEBSITE_DIR, 'dist'))) targets.push(f);

const problems = [];
for (const f of targets) {
  let text;
  try { text = await fs.readFile(f, 'utf8'); } catch { continue; }
  for (const re of PATTERNS) if (re.test(text)) problems.push(`${path.relative(WEBSITE_DIR, f)}: matches ${re}`);
  for (const n of sourceNames) if (text.includes(n)) problems.push(`${path.relative(WEBSITE_DIR, f)}: contains source file name "${n}"`);
}
if (problems.length) {
  console.error('Local path / source name leak detected:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`check:paths OK — ${targets.length} files scanned, no local paths or raw source names.`);
