// Portfolio manifest — posters live in /public/media/work, previews (.mp4)
// live on Cloudflare R2 (see src/data/media.ts). NEVER commit .mp4 to git:
// Cloudflare Pages fails builds with files > 25MB.
// `poster` is always shown; `preview` (720p) is the LIGHTBOX source on every
// device; `preview480` (480p/30) is what the cards on both rails stream.
// Legacy `previewMobile` is still honoured as a fallback for `preview480`.
// `aspect` drives the layout. `tag` maps to content.*.work.tags.
// `featured: true` pins a project to the top "best of" row; the rest scroll
// in the horizontal carousel below.

import { r2 } from './media';

export type TagKey = 'commercial' | 'ai' | 'fnb' | 'film' | 'personal';

export interface Project {
  id: string;
  title: Record<'vi' | 'en', string>;
  meta: Record<'vi' | 'en', string>;
  year: string;
  tag: TagKey;
  aspect: string; // CSS aspect-ratio
  poster: string;
  /** 720p30 — always used by the lightbox. */
  preview?: string;
  /** 480p30 — used by the cards on desktop and mobile alike. */
  preview480?: string;
  /** @deprecated superseded by preview480; kept as fallback. */
  previewMobile?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: 'mb',
    title: { vi: 'MB Bank — Brand Film', en: 'MB Bank — Brand Film' },
    meta: { vi: 'Sản xuất & hậu kỳ', en: 'Production & post' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/kz2-poster.jpg',
    preview: r2('work/kz2.mp4'),
    preview480: r2('work/kz2-480.mp4'),
    featured: true,
  },
  {
    id: 'ai',
    title: { vi: 'AI Creative — Hybrid Visual', en: 'AI Creative — Hybrid Visual' },
    meta: { vi: 'AI Creative', en: 'AI Creative' },
    year: '2026',
    tag: 'ai',
    aspect: '9 / 16',
    poster: '/media/work/nox-joy2-poster.jpg',
    preview: r2('work/nox-joy2.mp4'),
    preview480: r2('work/nox-joy2-480.mp4'),
    featured: true,
  },
  {
    id: 'leechloe',
    title: { vi: 'Lee Chloe Coffee', en: 'Lee Chloe Coffee' },
    meta: { vi: 'F&B production', en: 'F&B production' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/meitu2-poster.jpg',
    preview: r2('work/meitu2.mp4'),
    preview480: r2('work/meitu2-480.mp4'),
    featured: true,
  },
  {
    id: 'testai',
    title: { vi: 'TEST AI — Visual Concept', en: 'TEST AI — Visual Concept' },
    meta: { vi: 'AI Creative', en: 'AI Creative' },
    year: '2026',
    tag: 'ai',
    aspect: '9 / 16',
    poster: '/media/work/testai-poster.jpg',
    preview: r2('work/testai.mp4'), // 720x1280 lightbox
    preview480: r2('work/testai-480.mp4'), // 480x854 cards
    featured: true,
  },
  {
    id: 'rail-0404',
    title: { vi: '0404 — Social Film', en: '0404 — Social Film' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-0404.jpg',
    preview: r2('work/rail-0404.mp4'),
    preview480: r2('work/rail-0404-480.mp4'),
  },
  {
    id: 'rail-0926',
    title: { vi: '0926 — Social Film', en: '0926 — Social Film' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-0926.jpg',
    preview: r2('work/rail-0926.mp4'),
    preview480: r2('work/rail-0926-480.mp4'),
  },
  {
    id: 'rail-21gam',
    title: { vi: '21 Gam — Social Film', en: '21 Gam — Social Film' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-21gam.jpg',
    preview: r2('work/rail-21gam.mp4'),
    preview480: r2('work/rail-21gam-480.mp4'),
  },
  {
    id: 'rail-episode4',
    title: { vi: 'Peasant Market — Episode 4', en: 'Peasant Market — Episode 4' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-episode4.jpg',
    preview: r2('work/rail-episode4.mp4'),
    preview480: r2('work/rail-episode4-480.mp4'),
  },
  {
    id: 'rail-gc25',
    title: { vi: 'GC25 — Social Film', en: 'GC25 — Social Film' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-gc25.jpg',
    preview: r2('work/rail-gc25.mp4'),
    preview480: r2('work/rail-gc25-480.mp4'),
  },
  {
    id: 'rail-hanoi',
    title: { vi: 'Hà Nội Ơi', en: 'Hanoi Oi' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'film',
    aspect: '9 / 16',
    poster: '/media/work/rail-hanoi.jpg',
    preview: r2('work/rail-hanoi.mp4'),
    preview480: r2('work/rail-hanoi-480.mp4'),
  },
  {
    id: 'rail-kb5',
    title: { vi: 'KB5 — Nox', en: 'KB5 — Nox' },
    meta: { vi: 'AI Creative', en: 'AI Creative' },
    year: '2026',
    tag: 'ai',
    aspect: '9 / 16',
    poster: '/media/work/rail-kb5.jpg',
    preview: r2('work/rail-kb5.mp4'),
    preview480: r2('work/rail-kb5-480.mp4'),
  },
  {
    id: 'rail-mate-made',
    title: { vi: 'Mate Made', en: 'Mate Made' },
    meta: { vi: 'Brand & social', en: 'Brand & social' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-mate-made.jpg',
    preview: r2('work/rail-mate-made.mp4'),
    preview480: r2('work/rail-mate-made-480.mp4'),
  },
  {
    id: 'doc',
    title: { vi: 'Documentary — Vùng cao', en: 'Documentary — Highlands' },
    meta: { vi: 'Phim tài liệu ngắn', en: 'Short documentary' },
    year: '2026',
    tag: 'personal',
    aspect: '16 / 9',
    poster: '/media/work/doc.jpg',
    preview: r2('work/doc.mp4'), // 960x540 — best available (no 720p master)
    preview480: r2('work/doc-480.mp4'),
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const carouselProjects = projects.filter((p) => !p.featured);
