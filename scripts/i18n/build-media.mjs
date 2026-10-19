// Build src/i18n/media.json — the translated title/alt of every manifest item, per locale.
//
// The review file lists the media copy as `a · b · c` rows (and two `<Brand> · Post 0N` patterns for
// Social). This script zips each VI part with its translation, so the mapping does NOT depend on the
// order the media pipeline happened to scan in: every manifest string is looked up by its own VI text.
//
// Run: node scripts/i18n/build-media.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE = path.resolve(HERE, '../..');
const LOCALES = ['en', 'fr', 'de', 'nl'];

const strings = JSON.parse(await fs.readFile(path.join(WEBSITE, 'src/i18n/strings.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(WEBSITE, 'src/data/media.public.json'), 'utf8'));

/** Rows whose cells are `a · b · c` lists that map 1:1 onto manifest titles/alts. */
const LIST_ROWS = [
  'gallery.mediaTitleFallback', 'gallery.mediaAlt',
  'behind.mediaTitles', 'behind.mediaAlts',
  'cases.screenshotAlts', 'cases.videoMediaTitles', 'cases.videoMediaAlts',
  'hw.photoTitles', 'hw.photoAlts',
];

const byVi = new Map(); // viText -> { en, fr, de, nl }
const problems = [];

/** `Content & Video Editing 01 · 02 · 03` — the review file abbreviates repeats to the bare number.
 *  Expand such a part from the previous one (same text, trailing number swapped). */
const expand = (parts) => {
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    out.push(i > 0 && /^\d+$/.test(p) ? out[i - 1].replace(/\d+(?!.*\d)/, p) : p);
  }
  return out;
};

for (const id of LIST_ROWS) {
  const row = strings[id];
  if (!row) { problems.push(`missing row ${id}`); continue; }
  const parts = {};
  for (const l of ['vi', ...LOCALES]) parts[l] = expand((row.values[l] ?? row.values.vi).split(' · ').map((s) => s.trim()));
  const n = parts.vi.length;
  for (const l of LOCALES) if (parts[l].length !== n) problems.push(`${id}: ${l} has ${parts[l].length} parts, vi has ${n}`);
  for (let i = 0; i < n; i++) {
    const key = parts.vi[i];
    const rec = byVi.get(key) ?? {};
    for (const l of LOCALES) rec[l] = parts[l][i];
    byVi.set(key, rec);
  }
}

// Social: `<Brand> · Bài đăng 0N` / `Bài đăng 0N của <Brand>` patterns.
const socialTitle = Object.fromEntries(['vi', ...LOCALES].map((l) => [l, strings['social.photoTitle'].values[l]]));
const socialAlt = Object.fromEntries(['vi', ...LOCALES].map((l) => [l, strings['social.photoAlt'].values[l]]));
const socialFromVi = /^(?<brand>.+) · Bài đăng (?<num>\d+)$/;

const out = {};
let covered = 0;
let kept = 0;
let missing = 0;
for (const item of manifest.items) {
  const rec = {};
  for (const l of LOCALES) rec[l] = {};

  // --- title
  const social = socialFromVi.exec(item.title);
  if (social) {
    for (const l of LOCALES) rec[l].title = socialTitle[l].replace('<Brand>', social.groups.brand).replace('0N', social.groups.num);
  } else if (byVi.has(item.title)) {
    for (const l of LOCALES) rec[l].title = byVi.get(item.title)[l];
    covered++;
  } else {
    // Case-study screenshot titles are the brand names — "keep" rows, they fall back to the manifest.
    kept++;
  }

  // --- alt
  if (byVi.has(item.alt)) {
    for (const l of LOCALES) rec[l].alt = byVi.get(item.alt)[l];
  } else {
    // Social alt: `Bài đăng 0N của <Brand>`
    const m = /^Bài đăng (?<num>\d+) của (?<brand>.+)$/.exec(item.alt);
    if (m) {
      for (const l of LOCALES) rec[l].alt = socialAlt[l].replace('<Brand>', m.groups.brand).replace('0N', m.groups.num);
    } else {
      missing++;
      problems.push(`no translation for alt "${item.alt}" (${item.id})`);
    }
  }
  out[item.id] = rec;
}

await fs.writeFile(path.join(WEBSITE, 'src/i18n/media.json'), JSON.stringify(out, null, 2) + '\n');

const socialCount = manifest.items.filter((i) => socialFromVi.test(i.title)).length;
console.log(`media.json: ${manifest.items.length} items (${socialCount} social via pattern, ${covered} via list, ${kept} brand names kept, ${missing} untranslated)`);
if (problems.length) console.log('problems:\n  ' + problems.slice(0, 10).join('\n  '));
console.log('sample:', JSON.stringify(out['gallery-v01']), JSON.stringify(out['social-goodci-i07']), JSON.stringify(out['hw.photoTitles'] ?? {}));
