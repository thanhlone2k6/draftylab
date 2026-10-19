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
    // The review file documents template rows as `` `tpl ${x}` → "resolved example" `` and list rows as
    // `` `a · b` (vd "…") ``. Only the part BEFORE the arrow is the value — without this the Vietnamese
    // site printed the whole documentation line (the "Xem trên ${platform}" → … bug, 2026-10-19).
    .replace(/\s*→[\s\S]*$/, '')
    .replace(/\s*\((?:vd|e\.g\.|ví dụ)[^)]*\)\s*$/i, '')
    .replace(/`/g, '') // backticks wrap code/HTML inside the cell
    .replace(/\*\*/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s*↵\s*/g, '\n')
    .replace(/\\\|/g, '|')
    .replace(/\$\{(\w+)\}/g, '{$1}') // ${token} → {token} (our interpolation syntax)
    .trim();

/** VI cells that documented CODE instead of the value (the other four columns hold clean templates).
 *  These are the values the site actually used before i18n, so Vietnamese behaviour is unchanged —
 *  except the nav toggle, which now uses the Vietnamese wording content.ts always had for it. */
const VI_CODE_ROWS = {
  'nav.menuToggleAria': 'Mở menu / Đóng menu',
  'nav.logoAria': 'Drafty Lab — về đầu trang',
  'carousel.slideAria': '{itemTitle}, {index} of {count}',
  'carousel.live': '{label}, {index} of {count}',
};

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
  if (VI_CODE_ROWS[id]) rec.values.vi = VI_CODE_ROWS[id];
  out[id] = rec;
  n++;
}

/** Rows the site never renders as copy (the value is produced in code) — not worth flagging. */
const NOT_RENDERED = new Set([
  'gallery.duration', 'dialog.timecode', 'dialog.counter', 'trusted.partnerAlt',
  'global.robotsTxt', 'global.sitemap', 'global.themeColor', 'global.robots', 'footer.copyright',
]);

// Guard: nothing that still looks like documentation/code may reach the site.
const suspicious = [];
for (const [id, rec] of Object.entries(out)) {
  if (NOT_RENDERED.has(id)) continue;
  for (const l of LANGS) {
    const v = rec.values[l];
    if (v == null) continue;
    if (/→|\$\{|`|\*\*|\(vd /.test(v)) suspicious.push(`${id} [${l}]: ${v.slice(0, 70)}`);
    if (/\? ['"]|item\.title|fmtTime\(|fmtDuration\(/.test(v)) suspicious.push(`${id} [${l}] looks like code: ${v.slice(0, 70)}`);
  }
}
if (suspicious.length) {
  console.error(`!! ${suspicious.length} value(s) still look like documentation/code:`);
  suspicious.slice(0, 20).forEach((s) => console.error('   ' + s));
  process.exitCode = 1;
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
