// Build the PUBLIC manifest consumed by the frontend. Only whitelisted fields
// are copied — never sourcePath/sourceRel/fileName/hash.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const exists = (p) => fs.access(p).then(() => true, () => false);
const pad = (n) => String(n).padStart(2, '0');

/** Interleave images and videos (img, vid, img, vid…) so each carousel shows both early. */
export function interleave(list) {
  const imgs = list.filter((i) => i.type === 'image');
  const vids = list.filter((i) => i.type === 'video');
  const out = [];
  while (imgs.length || vids.length) {
    if (imgs.length) out.push(imgs.shift());
    if (vids.length) out.push(vids.shift());
  }
  return out;
}

export async function toPublicManifest(items, { outputDir, outputUrl, sections, roles = {}, files = {} }) {
  const social = sections.find((s) => s.id === 'social');
  const phase1 = items.filter((i) => i.phase === 1);
  const out = [];
  const brands = [];

  const build = async (it, sortOrder, label) => {
    const dir = it.brandId ? `${it.sectionId}/${it.brandId}` : it.sectionId;
    const posterRel = files[it.id]?.poster;
    if (!posterRel || !(await exists(path.join(outputDir, posterRel)))) return null;
    const pm = await sharp(path.join(outputDir, posterRel)).metadata();
    const rec = {
      id: it.id,
      type: it.type,
      sectionId: it.sectionId,
      ...(it.brandId ? { brandId: it.brandId } : {}),
      title: label.title,
      alt: label.alt,
      posterSrc: `${outputUrl}/${posterRel}`,
      posterWidth: pm.width,
      posterHeight: pm.height,
      width: it.width,
      height: it.height,
      aspectRatio: Math.round((it.width / it.height) * 10000) / 10000,
      sortOrder,
    };
    if (it.type === 'image') {
      const fullRel = files[it.id]?.full;
      if (fullRel && (await exists(path.join(outputDir, fullRel)))) rec.fullImageSrc = `${outputUrl}/${fullRel}`;
    } else {
      rec.durationSeconds = it.durationSeconds;
      const vRel = files[it.id]?.video;
      rec.encoded = !!vRel && (await exists(path.join(outputDir, vRel)));
      if (rec.encoded) rec.videoSrc = `${outputUrl}/${vRel}`;
      const pRel = files[it.id]?.preview;
      if (pRel && (await exists(path.join(outputDir, pRel)))) rec.previewSrc = `${outputUrl}/${pRel}`;
    }
    return rec;
  };

  const gallery = phase1.filter((i) => i.sectionId === 'gallery' && i.type === 'video');
  for (const [n, it] of gallery.entries()) {
    const r = await build(it, n + 1, { title: `Content & Video Editing ${pad(n + 1)}`, alt: `Ảnh đại diện video Content & Video Editing ${pad(n + 1)}` });
    if (r) out.push(r);
  }

  for (const [bi, b] of social.brands.entries()) {
    const list = interleave(phase1.filter((i) => i.sectionId === 'social' && i.brandId === b.id));
    const ids = [];
    let ni = 0, nv = 0;
    for (const [n, it] of list.entries()) {
      const isV = it.type === 'video';
      const k = isV ? ++nv : ++ni;
      const r = await build(it, n + 1, {
        title: `${b.displayName} · ${isV ? 'Video' : 'Bài đăng'} ${pad(k)}`,
        alt: isV ? `Ảnh đại diện video ${pad(k)} của ${b.displayName}` : `Bài đăng ${pad(k)} của ${b.displayName}`,
      });
      if (r) { out.push(r); ids.push(r.id); }
    }
    brands.push({ id: b.id, displayName: b.displayName, sortOrder: bi + 1, mediaIds: ids });
  }

  // Phase 2 sections: role/title/alt come from media-roles.json (never from file names).
  const labelled = ['behind-raw-final', 'behind-ai-workflow', 'case-studies', 'how-i-work'];
  for (const sectionId of labelled) {
    const list = items.filter((i) => i.sectionId === sectionId);
    for (const [n, it] of list.entries()) {
      const r = roles[it.id];
      if (!r) continue;
      const rec = await build(it, n + 1, { title: r.title, alt: r.alt });
      if (!rec) continue;
      if (r.role) rec.role = r.role;
      if (r.crop) {
        // Dimensions of the delivered (cropped) image, not of the raw screenshot.
        rec.width = r.crop.width;
        rec.height = r.crop.height;
        rec.aspectRatio = Math.round((r.crop.width / r.crop.height) * 10000) / 10000;
      }
      out.push(rec);
    }
  }

  return { generatedAt: new Date().toISOString(), items: out, brands };
}
