#!/usr/bin/env node
// Contact sheet of every generated video poster for user approval → docs/posters-review.html
// Opens straight from disk (image paths point to ../public/media/v2); never shipped in the build.
import fs from 'node:fs/promises';
import path from 'node:path';
import { PUBLIC_MANIFEST, WEBSITE_DIR } from './lib/config.mjs';

const { items } = JSON.parse(await fs.readFile(PUBLIC_MANIFEST, 'utf8'));
const vids = items.filter((i) => i.type === 'video');
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const html = `<!doctype html><meta charset="utf-8"><title>Poster review — Drafty Lab V2</title>
<meta name="robots" content="noindex">
<style>body{background:#0b0b0f;color:#f5f3ee;font:14px -apple-system,system-ui,sans-serif;margin:24px}
h1{font-size:20px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
figure{margin:0}img{width:100%;border-radius:10px;background:#17171d;display:block}
figcaption{margin-top:6px;color:#a7a49c;font-size:12px;line-height:1.4}.ok{color:#9fd49a}.no{color:#e9c77d}</style>
<h1>Poster review — ${vids.length} video (frame tự chọn 0.5–3s, tránh khung đen)</h1>
<p>Đánh dấu poster nào cần đổi frame; có thể chỉ định giây cụ thể khi batch.</p>
<div class="g">${vids
  .map((v) => `<figure> <img src="../public${v.posterSrc}" alt="" loading="lazy"><figcaption><b>${v.id}</b><br>${v.title} · ${fmt(v.durationSeconds)} · ${v.width}×${v.height}<br>${v.encoded ? '<span class="ok">đã encode (prototype)</span>' : '<span class="no">chưa encode</span>'}</figcaption></figure>`)
  .join('')}</div>`;
await fs.writeFile(path.join(WEBSITE_DIR, 'docs/posters-review.html'), html);
console.log(`posters-review.html: ${vids.length} posters`);
