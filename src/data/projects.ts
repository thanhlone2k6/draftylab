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
    title: { vi: 'Skyline — Brand Film', en: 'Skyline — Brand Film' },
    meta: { vi: 'Sản xuất & hậu kỳ', en: 'Production & post' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/kz2-poster.webp',
    preview: r2('work/kz2.mp4'),
    preview480: r2('work/kz2-480.mp4'),
    featured: true,
  },
  {
    id: 'ai',
    title: { vi: 'Nox Joy — Office Skit', en: 'Nox Joy — Office Skit' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/nox-joy2-poster.webp',
    preview: r2('work/nox-joy2.mp4'),
    preview480: r2('work/nox-joy2-480.mp4'),
    featured: true,
  },
  {
    id: 'leechloe',
    title: { vi: 'Meitu — KOL Social', en: 'Meitu — KOL Social' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/meitu2-poster.webp',
    preview: r2('work/meitu2.mp4'),
    preview480: r2('work/meitu2-480.mp4'),
    featured: true,
  },
  {
    id: 'testai',
    title: { vi: 'Temple Drone — AI Visual', en: 'Temple Drone — AI Visual' },
    meta: { vi: 'AI Creative', en: 'AI Creative' },
    year: '2026',
    tag: 'ai',
    aspect: '9 / 16',
    poster: '/media/work/testai-poster.webp',
    preview: r2('work/testai.mp4'), // 720x1280 lightbox
    preview480: r2('work/testai-480.mp4'), // 480x854 cards
    featured: true,
  },
  {
    id: 'rail-0404',
    title: { vi: 'Grill House — F&B Film', en: 'Grill House — F&B Film' },
    meta: { vi: 'F&B production', en: 'F&B production' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/rail-0404.webp',
    preview: r2('work/rail-0404.mp4'),
    preview480: r2('work/rail-0404-480.mp4'),
  },
  {
    id: 'rail-0926',
    title: { vi: 'Miso Ramen — F&B Film', en: 'Miso Ramen — F&B Film' },
    meta: { vi: 'F&B production', en: 'F&B production' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/rail-0926.webp',
    preview: r2('work/rail-0926.mp4'),
    preview480: r2('work/rail-0926-480.mp4'),
  },
  {
    id: 'rail-21gam',
    title: { vi: '21 Gam — Brand Social', en: '21 Gam — Brand Social' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-21gam.webp',
    preview: r2('work/rail-21gam.mp4'),
    preview480: r2('work/rail-21gam-480.mp4'),
  },
  {
    id: 'rail-episode4',
    title: { vi: 'Peasant Market — Series E04', en: 'Peasant Market — Series E04' },
    meta: { vi: 'Social production', en: 'Social production' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-episode4.webp',
    preview: r2('work/rail-episode4.mp4'),
    preview480: r2('work/rail-episode4-480.mp4'),
  },
  {
    id: 'rail-gc25',
    title: { vi: 'Good Ci — Restaurant Film', en: 'Good Ci — Restaurant Film' },
    meta: { vi: 'F&B production', en: 'F&B production' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/rail-gc25.webp',
    preview: r2('work/rail-gc25.mp4'),
    preview480: r2('work/rail-gc25-480.mp4'),
  },
  {
    id: 'rail-hanoi',
    title: { vi: 'Bún Mắm Tôm Hà Nội', en: 'Hanoi Shrimp Paste Noodles' },
    meta: { vi: 'F&B production', en: 'F&B production' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/rail-hanoi.webp',
    preview: r2('work/rail-hanoi.mp4'),
    preview480: r2('work/rail-hanoi-480.mp4'),
  },
  {
    id: 'rail-kb5',
    title: { vi: 'Nox Joy — Gaming Promo', en: 'Nox Joy — Gaming Promo' },
    meta: { vi: 'Gaming & social', en: 'Gaming & social' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-kb5.webp',
    preview: r2('work/rail-kb5.mp4'),
    preview480: r2('work/rail-kb5-480.mp4'),
  },
  {
    id: 'rail-mate-made',
    title: { vi: 'Mate Made — Lifestyle Film', en: 'Mate Made — Lifestyle Film' },
    meta: { vi: 'Brand & social', en: 'Brand & social' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/rail-mate-made.webp',
    preview: r2('work/rail-mate-made.mp4'),
    preview480: r2('work/rail-mate-made-480.mp4'),
  },
  {
    id: 'doc',
    title: { vi: 'Lanh Lùng Tám — Phim Tài Liệu', en: 'Lanh Lung Tam — Short Documentary' },
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
