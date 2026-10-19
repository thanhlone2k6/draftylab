// Parse the owner's review MD into a machine-readable dictionary.
// Run: node scripts/i18n/parse-review.mjs
// Reads  ../../ngôn ngữ/CONTENT_I18N_5_LANGUAGES_REVIEW.md   (DFL2 root, outside the website/)
// Writes src/i18n/strings.json                               (committed; the app reads this)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE = path.resolve(HERE, '../..');
const SRC = process.env.REVIEW_MD || path.resolve(WEBSITE, '../ngôn ngữ/CONTENT_I18N_5_LANGUAGES_REVIEW.md');
const OUT = path.join(WEBSITE, 'src/i18n/strings.json');

const LANGS = ['vi', 'en', 'fr', 'de', 'nl'];
const STATUS = { 'Cần dịch': 'translate', 'Giữ nguyên': 'keep', '⚠️ Cần duyệt': 'review' };

const clean = (s) =>
  s
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s*↵\s*/g, '\n')
    .replace(/\\\|/g, '|')
    .replace(/\*\*/g, '');

/** Split a markdown table row on UNESCAPED pipes only (a cell may contain `\|\|`). */
const splitRow = (raw) => {
  const cells = [];
  let cur = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '\\' && raw[i + 1] === '|') { cur += '\\|'; i++; continue; }
    if (ch === '|') { cells.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells.slice(1, -1).map((c) => c.trim());
};

const text = await fs.readFile(SRC, 'utf8');
const out = {};
let section = '';
let n = 0;
const problems = [];

for (const raw of text.split('\n')) {
  const h = raw.match(/^### (.+)$/);
  if (h) { section = h[1].trim(); continue; }
  if (!raw.startsWith('|')) continue;
  const cells = splitRow(raw);
  if (cells.length !== 8) continue;
  const [idRaw, vi, en, fr, de, nl, status, source] = cells;
  if (idRaw === 'ID' || /^-+$/.test(idRaw)) continue;
  const id = idRaw.replace(/^`|`$/g, '');
  if (!id || out[id]) { problems.push(`duplicate/empty id: ${idRaw}`); continue; }
  const values = { vi, en, fr, de, nl };
  const rec = { section, status: STATUS[status] ?? status, source, values: {} };
  for (const l of LANGS) {
    const v = clean(values[l]);
    if (v === '—' || v === '*(rỗng)*') { rec.values[l] = null; continue; }
    rec.values[l] = v;
  }
  out[id] = rec;
  n++;
}

// Report: which rows are "keep" but still carry translations, and vice versa.
const kept = Object.entries(out).filter(([, r]) => r.status === 'keep');
const translated = Object.entries(out).filter(([, r]) => r.status === 'translate');
const review = Object.entries(out).filter(([, r]) => r.status === 'review');
const keepWithText = kept.filter(([, r]) => LANGS.some((l) => r.values[l] && r.values[l] !== r.values.vi));
const missing = Object.entries(out).filter(([, r]) => r.status !== 'keep' && LANGS.some((l) => r.values[l] === null));

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');

console.log(`parsed ${n} ids -> ${path.relative(WEBSITE, OUT)}`);
console.log(`  translate: ${translated.length} | review: ${review.length} | keep: ${kept.length}`);
if (problems.length) console.log('  problems:', problems.slice(0, 5));
if (keepWithText.length) console.log('  keep-rows carrying translations:', keepWithText.map(([k]) => k).join(', '));
if (missing.length) console.log('  rows with a missing translation:', missing.map(([k]) => k).join(', '));
const sections = [...new Set(Object.values(out).map((r) => r.section))];
console.log('  sections:', sections.length);
