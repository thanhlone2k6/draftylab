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
  const k = pub.items.find((i) => i.id === 'social-kazaki-v02');
  assert.ok(k.aspectRatio > 1.7 && k.aspectRatio < 1.8);
});

test('public manifest has no source paths or raw file names', () => {
  const text = JSON.stringify(pub);
  assert.doesNotMatch(text, /\/Users\/|sourcePath|sourceRel|fileName|DFL2/);
  for (const it of internal.items.filter((i) => /\s|[^\x00-\x7F]/.test(i.fileName))) assert.ok(!text.includes(it.fileName), it.fileName);
});

test('brand order follows the spec and every phase-1 brand has items', () => {
  assert.deepEqual(pub.brands.map((b) => b.id), ['dinhhouse', 'leechloe', 'kazaki', 'goodci', 'winnie', 'marie', 'porche']);
  for (const b of pub.brands) assert.ok(b.mediaIds.length > 0, b.id);
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
  for (const id of ['behind-raw-final-v01', 'behind-raw-final-v02', 'behind-ai-workflow-i01', 'behind-ai-workflow-i02', 'case-studies-i01', 'case-studies-i02', 'case-studies-i03']) {
    const it = pub.items.find((i) => i.id === id);
    assert.ok(it, id);
    assert.ok(it.title && it.alt && it.role, id);
  }
  assert.equal(pub.items.filter((i) => i.sectionId === 'how-i-work').length, 11);
});

test('cropped case-study screenshots report the cropped size (contact details removed)', () => {
  const k = pub.items.find((i) => i.id === 'case-studies-i03');
  assert.equal(k.height, 140);
  assert.ok(k.aspectRatio > 3.5);
});

test('raw video is delivered portrait (rotation applied)', () => {
  const raw = pub.items.find((i) => i.id === 'behind-raw-final-v01');
  assert.ok(raw.aspectRatio < 1);
});
