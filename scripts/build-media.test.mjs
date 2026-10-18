// node --test scripts/build-media.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { INTERNAL_MANIFEST, PUBLIC_MANIFEST, SECTIONS, EXPECTED_COUNTS } from './lib/config.mjs';
import { interleave } from './lib/public-manifest.mjs';

const roles = JSON.parse(await fs.readFile(new URL('./media-roles.json', import.meta.url), 'utf8'));

const internal = JSON.parse(await fs.readFile(INTERNAL_MANIFEST, 'utf8'));
const pub = JSON.parse(await fs.readFile(PUBLIC_MANIFEST, 'utf8'));

test('ids are unique and ASCII-only', () => {
  const ids = internal.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('expected video counts (19 social, 4 gallery)', () => {
  const social = internal.items.filter((i) => i.sectionId === 'social' && i.type === 'video');
  const gallery = internal.items.filter((i) => i.sectionId === 'gallery' && i.type === 'video');
  assert.equal(social.length, EXPECTED_COUNTS.socialVideos);
  assert.equal(gallery.length, EXPECTED_COUNTS.galleryVideos);
});

test('every social item maps to the brand folder it came from', () => {
  const social = SECTIONS.find((s) => s.id === 'social');
  for (const it of internal.items.filter((i) => i.sectionId === 'social')) {
    const brand = social.brands.find((b) => b.id === it.brandId);
    assert.ok(brand, it.id);
    assert.ok(it.sourceRel.includes(`/${brand.folder}/`), `${it.id} → ${it.sourceRel}`);
  }
});

test('rotation is applied to display dimensions (raw.MP4 is -90°, portrait)', () => {
  const raw = internal.items.find((i) => i.fileName === 'raw.MP4');
  assert.ok(raw);
  assert.equal(Math.abs(raw.rotation), 90);
  assert.ok(raw.height > raw.width, 'display orientation must be portrait');
});

test('landscape source keeps landscape aspect in the public manifest', () => {
  // 2026-10-18: the owner re-picked the Social Production photos (`ảnh riêng/lựa chọn`), so the
  // landscape check now uses the remaining landscape photo of that section (Porche "Bài đăng 01",
  // IMG_0960.JPG, 6000×4000).
  const k = pub.items.find((i) => i.id === 'social-porche-i01');
  assert.ok(k, 'social-porche-i01 must exist');
  assert.ok(k.aspectRatio > 1.4 && k.aspectRatio < 1.6);
});

test('public manifest has no source paths or raw file names', () => {
  const text = JSON.stringify(pub);
  assert.doesNotMatch(text, /\/Users\/|sourcePath|sourceRel|fileName|DFL2/);
  for (const it of internal.items.filter((i) => /\s|[^\x00-\x7F]/.test(i.fileName))) assert.ok(!text.includes(it.fileName), it.fileName);
});

test('brand order follows the spec; video-only brands are empty by design', () => {
  assert.deepEqual(pub.brands.map((b) => b.id), ['dinhhouse', 'leechloe', 'kazaki', 'goodci', 'winnie', 'marie', 'porche']);
  // Marie and Winnie were video-only folders. The owner moved every Social Production video out of
  // the scanned tree (2026-10-18), so those two now hold no items and the rail filters them out
  // (`brands` in src/lib/media.ts) — every other brand must still have something to show.
  for (const b of pub.brands) {
    const videoOnly = b.id === 'marie' || b.id === 'winnie';
    assert.equal(b.mediaIds.length > 0, !videoOnly, `${b.id} (${b.mediaIds.length} items)`);
  }
});

test('non-encoded videos are flagged and carry no videoSrc', () => {
  for (const v of pub.items.filter((i) => i.type === 'video')) {
    if (v.encoded) assert.match(v.videoSrc, /^\/media\/v2\/.+-720\.[0-9a-f]{8}\.mp4$/);
    else assert.equal(v.videoSrc, undefined);
  }
});

test('interleave alternates image/video and keeps every item', () => {
  const list = [{ type: 'image', id: 'a' }, { type: 'image', id: 'b' }, { type: 'video', id: 'c' }];
  assert.deepEqual(interleave(list).map((x) => x.id), ['a', 'c', 'b']);
});

test('phase-2 ids still point at the files media-roles.json expects (no id drift)', () => {
  for (const [id, r] of Object.entries(roles)) {
    if (id.startsWith('$')) continue;
    const it = internal.items.find((i) => i.id === id);
    assert.ok(it, `${id} missing from the scan`);
    assert.equal(it.fileName.normalize('NFC'), r.expectFile.normalize('NFC'), `${id} now points to ${it.fileName}`);
  }
});

test('phase-2 public items exist with labels and roles', () => {
  for (const id of ['behind-raw-final-v01', 'behind-raw-final-v02', 'behind-ai-workflow-i01', 'behind-ai-workflow-i02', 'case-studies-i01', 'case-studies-i02', 'case-studies-i03', 'case-studies-i04', 'case-studies-v01', 'case-studies-v02', 'case-studies-v03']) {
    const it = pub.items.find((i) => i.id === id);
    assert.ok(it, id);
    assert.ok(it.title && it.alt && it.role, id);
  }
  assert.equal(pub.items.filter((i) => i.sectionId === 'how-i-work').length, 11);
});

test('case-study screenshots are the cropped phone mockups (transparent frame removed)', () => {
  // Source PNGs are 2500×2500 with the device at 666,63 1160×2370 on a transparent background
  // (scripts/media-roles.json `crop`), so every card is the same portrait phone.
  const cs = pub.items.filter((i) => i.sectionId === 'case-studies' && i.type === 'image');
  assert.equal(cs.length, 4);
  for (const k of cs) {
    assert.equal(k.width, 1160, k.id);
    assert.equal(k.height, 2370, k.id);
    assert.ok(k.aspectRatio > 0.48 && k.aspectRatio < 0.5, `${k.id} aspect ${k.aspectRatio}`);
    assert.ok(k.posterHeight > k.posterWidth, k.id);
  }
});

test('case-study video cards: 3 portrait clips, each with a poster and an audio-bearing-or-silent hover preview', () => {
  const vids = pub.items.filter((i) => i.sectionId === 'case-studies' && i.type === 'video');
  assert.deepEqual(vids.map((v) => v.id).sort(), ['case-studies-v01', 'case-studies-v02', 'case-studies-v03']);
  for (const v of vids) {
    assert.ok(v.previewSrc && v.posterSrc && v.role?.startsWith('case-video:'), v.id);
    assert.ok(v.aspectRatio < 1, v.id);
  }
});

test('raw video is delivered portrait (rotation applied)', () => {
  const raw = pub.items.find((i) => i.id === 'behind-raw-final-v01');
  assert.ok(raw.aspectRatio < 1);
});
