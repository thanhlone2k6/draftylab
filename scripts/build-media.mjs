#!/usr/bin/env node
// Build web media from the internal manifest:
//   • WebP posters for every image and video of phases 1–2 (always; --phase=1 limits to phase 1)
//   • WebP full-size images for the image lightbox (not for case-study screenshots)
//   • H.264/AAC 720p MP4 for videos in the selected set (--set=prototype|phase2|all, or --only=id,id)
//   • media-roles.json: per-id crop (privacy) + labels for phase-2 sections
// Incremental: skips outputs whose source (size+mtime+hash) and preset are unchanged.
// Writes src/data/media.public.json (no source paths).
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { INTERNAL_MANIFEST, BUILD_CACHE, PUBLIC_MANIFEST, OUTPUT_DIR, OUTPUT_URL, SECTIONS } from './lib/config.mjs';
import { ffmpeg, videoArgs, scaleFilter } from './lib/encode.mjs';
import { toPublicManifest } from './lib/public-manifest.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const setName = args.set ?? 'prototype';
const sets = JSON.parse(await fs.readFile(new URL('./media-sets.json', import.meta.url), 'utf8'));
const presets = JSON.parse(await fs.readFile(new URL('./encode-presets.json', import.meta.url), 'utf8'));
const { items } = JSON.parse(await fs.readFile(INTERNAL_MANIFEST, 'utf8'));
const roles = JSON.parse(await fs.readFile(new URL('./media-roles.json', import.meta.url), 'utf8'));
let cache = {};
try { cache = JSON.parse(await fs.readFile(BUILD_CACHE, 'utf8')); } catch {}

const maxPhase = Number(args.phase ?? 2);
const phase1 = items.filter((i) => i.phase <= maxPhase); // duplicates (same bytes) simply produce identical outputs per id
const encodeIds = new Set(
  args.only ? args.only.split(',') : setName === 'all' ? phase1.filter((i) => i.type === 'video').map((i) => i.id) : sets[setName] ?? []
);

const POSTER_LONG = 1080;
const FULL_LONG = 1600;
const fingerprint = (it, extra) => crypto.createHash('sha1').update(`${it.sizeBytes}:${it.mtimeMs}:${it.hash}:${JSON.stringify(extra)}`).digest('hex').slice(0, 12);
const outPath = (rel) => path.join(OUTPUT_DIR, rel);
const exists = (p) => fs.access(p).then(() => true, () => false);

// iPhone HEIC/HEIF photos (e.g. the two in How I Work's "Lên lịch đăng bài") can't be decoded by this
// sharp build (no HEVC plugin). macOS `sips` converts them to a temp JPEG that sharp reads fine; the
// result is cached by content hash so a re-build does no extra work. macOS-only, like the rest of this pipeline.
const execFileP = promisify(execFile);
async function decodedSource(it) {
  if (it.type !== 'image' || !/^hei[cf]$/.test(String(it.format || ''))) return it.sourcePath;
  const out = path.join(os.tmpdir(), `dfl2-heic-${it.id}-${it.hash || 'x'}.jpg`);
  if (!(await exists(out))) {
    await execFileP('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', 'best', it.sourcePath, '--out', out]);
  }
  return out;
}

async function needs(key, fp, file) {
  return cache[key] !== fp || !(await exists(file));
}
async function atomicWrite(file, writer) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp${path.extname(file)}`;
  await writer(tmp);
  await fs.rename(tmp, file);
}

function presetFor(it) {
  if (it.width > it.height) return { name: 'landscape', ...presets.landscape };
  if (it.durationSeconds > 75) return { name: 'longform', ...presets.longform };
  return { name: 'shortform', ...presets.shortform };
}

async function posterFromVideo(it, file) {
  // Representative frame from 0.5–3s (thumbnail filter avoids black/fade frames).
  const tmpPng = path.join(os.tmpdir(), `dfl2-${it.id}-${process.pid}.png`);
  await ffmpeg(['-ss', '0.5', '-t', '2.5', '-i', it.sourcePath, '-vf', 'thumbnail=60', '-frames:v', '1', '-update', '1', tmpPng]);
  await atomicWrite(file, (tmp) => sharp(tmpPng).resize({ width: POSTER_LONG, height: POSTER_LONG, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(tmp));
  await fs.rm(tmpPng, { force: true });
}

const files = {}; // id → { poster, full, video, preview } (relative, content-hashed) — feeds the public manifest
const imgName = (it, kind, fp) => {
  const dir = it.brandId ? `${it.sectionId}/${it.brandId}` : it.sectionId;
  return { dir, rel: `${dir}/${it.id}-${kind}.${fp.slice(0, 8)}.webp`, legacy: `${dir}/${it.id}-${kind}.webp` };
};
async function adoptImage(key, fp, { rel, legacy, dir }, id, kind) {
  if (!(await exists(outPath(rel))) && cache[key] === fp && (await exists(outPath(legacy)))) await fs.rename(outPath(legacy), outPath(rel));
  let list = [];
  try { list = await fs.readdir(path.join(OUTPUT_DIR, dir)); } catch {}
  for (const f of list) if (f.startsWith(`${id}-${kind}.`) && f.endsWith('.webp') && `${dir}/${f}` !== rel) await fs.rm(path.join(OUTPUT_DIR, dir, f), { force: true });
}

const tasks = [];
for (const it of phase1) {
  const posterKey = `${it.id}:poster`;
  const posterFp = fingerprint(it, { POSTER_LONG, crop: roles[it.id]?.crop, v: 3 });
  const poster = imgName(it, 'poster', posterFp);
  files[it.id] = { poster: poster.rel };
  tasks.push(async () => {
    await adoptImage(posterKey, posterFp, poster, it.id, 'poster');
    if (!(await needs(posterKey, posterFp, outPath(poster.rel)))) return;
    if (it.type === 'video') await posterFromVideo(it, outPath(poster.rel));
    else {
      const src = await decodedSource(it);
      await atomicWrite(outPath(poster.rel), (tmp) => sharp(src).rotate().extract(roles[it.id]?.crop ?? { left: 0, top: 0, width: it.width, height: it.height }).resize({ width: POSTER_LONG, height: POSTER_LONG, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(tmp));
    }
    cache[posterKey] = posterFp; console.log('poster', it.id);
  });
  if (it.type === 'image' && it.sectionId !== 'case-studies') {
    const key = `${it.id}:full`; const fp = fingerprint(it, { FULL_LONG, v: 1 });
    const full = imgName(it, 'full', fp);
    files[it.id].full = full.rel;
    tasks.push(async () => {
      await adoptImage(key, fp, full, it.id, 'full');
      if (!(await needs(key, fp, outPath(full.rel)))) return;
      const src = await decodedSource(it);
      await atomicWrite(outPath(full.rel), (tmp) => sharp(src).rotate().resize({ width: FULL_LONG, height: FULL_LONG, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(tmp));
      cache[key] = fp; console.log('full', it.id);
    });
  }
}

// Output names carry an 8-hex content hash (source + encode preset), so files can be cached `immutable` for a year
// on the CDN and a re-encode can never be served stale. `files` feeds the public manifest.
const hashed = (it, kind, fp) => {
  const dir = it.brandId ? `${it.sectionId}/${it.brandId}` : it.sectionId;
  return { dir, rel: `${dir}/${it.id}-${kind}.${fp.slice(0, 8)}.mp4`, legacy: `${dir}/${it.id}-${kind}.mp4` };
};
/** Rename a pre-hash output to its hashed name when it was produced by the same source + preset (no re-encode). */
async function adoptLegacy(key, fp, { rel, legacy, dir }, id, kind) {
  if (!(await exists(outPath(rel))) && cache[key] === fp && (await exists(outPath(legacy)))) {
    await fs.rename(outPath(legacy), outPath(rel));
    console.log('renamed', legacy, '→', rel);
  }
  // drop superseded outputs of the same item (generated files only)
  let list = [];
  try { list = await fs.readdir(path.join(OUTPUT_DIR, dir)); } catch {}
  for (const f of list) {
    if (f.startsWith(`${id}-${kind}.`) && f.endsWith('.mp4') && `${dir}/${f}` !== rel) await fs.rm(path.join(OUTPUT_DIR, dir, f), { force: true });
  }
}

const videoTasks = [];
for (const it of phase1.filter((i) => i.type === 'video')) {
  const p = presetFor(it);
  const key = `${it.id}:video`; const fp = fingerprint(it, p);
  const names = hashed(it, '720', fp);
  files[it.id] = { ...files[it.id], video: names.rel };
  videoTasks.push(async () => {
    await adoptLegacy(key, fp, names, it.id, '720');
    if (!encodeIds.has(it.id)) return;
    if (!(await needs(key, fp, outPath(names.rel)))) return;
    const t0 = Date.now();
    await atomicWrite(outPath(names.rel), (tmp) => ffmpeg(['-i', it.sourcePath, ...videoArgs(p), '-map_metadata', '-1', tmp]));
    cache[key] = fp; console.log('video', it.id, p.name, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  });
}

// Hover previews: short, silent, small clips for the cards that preview in place (gallery + Raw/Final).
// Always built for those sections (cheap) so a hover never has to download the 720p lightbox file.
// 2026-10-19 (owner): "video này đang để định dạng gì… t muốn load nhanh hơn… phải 480p thôi" — the
// previews were 540px on the short edge at ~1 Mbps (1.4–1.6 MB each). Now 480px AND a lighter encode:
// at card size (≤280px wide, ~110px on phones) CRF 32 is visually identical to the old CRF 27 but ~45%
// smaller. The lightbox still plays the untouched 720p file, so nothing full-size got softer.
const PREVIEW_SECONDS = 12;
const PREVIEW = { crf: 32, maxrate: '700k', bufsize: '1400k', maxShort: 480, audioBitrate: '64k' };
for (const it of phase1.filter((i) => i.type === 'video' && ['gallery', 'behind-raw-final', 'case-studies'].includes(i.sectionId))) {
  // Gallery + case-study previews carry audio (the case-study card starts muted and the viewer can unmute); Raw/Final previews stay silent.
  const withAudio = ['gallery', 'case-studies'].includes(it.sectionId) && !!it.audioCodec;
  const key = `${it.id}:preview`; const fp = fingerprint(it, { PREVIEW_SECONDS, withAudio, ...PREVIEW });
  const names = hashed(it, 'preview', fp);
  files[it.id] = { ...files[it.id], preview: names.rel };
  videoTasks.push(async () => {
    await adoptLegacy(key, fp, names, it.id, 'preview');
    if (!(await needs(key, fp, outPath(names.rel)))) return;
    await atomicWrite(outPath(names.rel), (tmp) => ffmpeg([
      '-t', String(PREVIEW_SECONDS), '-i', it.sourcePath,
      '-vf', scaleFilter(PREVIEW.maxShort),
      ...(withAudio ? ['-c:a', 'aac', '-b:a', PREVIEW.audioBitrate, '-ac', '2'] : ['-an']),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(PREVIEW.crf),
      '-maxrate', PREVIEW.maxrate, '-bufsize', PREVIEW.bufsize, '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-map_metadata', '-1', tmp,
    ]));
    cache[key] = fp; console.log('preview', it.id, withAudio ? '(audio)' : '(silent)');
  });
}

// Images/posters in parallel (bounded); videos sequentially (x264 already uses all cores).
const pool = async (fns, n) => { const q = [...fns]; await Promise.all(Array.from({ length: n }, async () => { while (q.length) await q.shift()(); })); };
await pool(tasks, Math.max(2, Math.min(6, os.cpus().length - 2)));
await fs.mkdir(path.dirname(BUILD_CACHE), { recursive: true });
await fs.writeFile(BUILD_CACHE, JSON.stringify(cache, null, 2));
for (const t of videoTasks) { await t(); await fs.writeFile(BUILD_CACHE, JSON.stringify(cache, null, 2)); }

const manifest = await toPublicManifest(items.filter((i) => i.phase <= maxPhase), { outputDir: OUTPUT_DIR, outputUrl: OUTPUT_URL, sections: SECTIONS, roles, files });
await fs.writeFile(PUBLIC_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Public manifest: ${manifest.items.length} items, ${manifest.items.filter((i) => i.encoded).length} encoded videos.`);
