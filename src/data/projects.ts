// Portfolio manifest — replace media files in /public/media/work to update the site.
// `poster` is always shown; `preview` (optional) plays on hover / on tap.
// `aspect` drives the layout. `tag` maps to content.*.work.tags.
// `featured: true` pins a project to the top "best of" row; the rest scroll
// in the horizontal carousel below.

export type TagKey = 'commercial' | 'ai' | 'fnb' | 'film' | 'personal';

export interface Project {
  id: string;
  title: Record<'vi' | 'en', string>;
  meta: Record<'vi' | 'en', string>;
  year: string;
  tag: TagKey;
  aspect: string; // CSS aspect-ratio
  poster: string;
  preview?: string;
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
    preview: '/media/work/kz2.mp4',
    featured: true,
  },
  {
    id: 'ai',
    title: { vi: 'AI Creative — Hybrid Visual', en: 'AI Creative — Hybrid Visual' },
    meta: { vi: 'AI & thế giới hình ảnh', en: 'AI & world-building' },
    year: '2026',
    tag: 'ai',
    aspect: '9 / 16',
    poster: '/media/work/nox-joy2-poster.jpg',
    preview: '/media/work/nox-joy2.mp4',
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
    preview: '/media/work/meitu2.mp4',
    featured: true,
  },
  {
    id: 'pomalo',
    title: { vi: 'NB Pomalo — Beverage', en: 'NB Pomalo — Beverage' },
    meta: { vi: 'F&B · quay thật', en: 'F&B · live action' },
    year: '2026',
    tag: 'fnb',
    aspect: '9 / 16',
    poster: '/media/work/pomalo.jpg',
    preview: '/media/work/pomalo.mp4',
  },
  {
    id: 'winnie',
    title: { vi: 'Winnie — Social Series', en: 'Winnie — Social Series' },
    meta: { vi: 'Quay & dựng', en: 'Shoot & edit' },
    year: '2026',
    tag: 'commercial',
    aspect: '9 / 16',
    poster: '/media/work/winnie.jpg',
    preview: '/media/work/winnie.mp4',
  },
  {
    id: 'kazaki',
    title: { vi: 'Kazaki Ramen', en: 'Kazaki Ramen' },
    meta: { vi: 'Brand & social', en: 'Brand & social' },
    year: '2026',
    tag: 'fnb',
    aspect: '16 / 9',
    poster: '/media/work/kazaki.jpg',
    preview: '/media/work/kazaki.mp4',
  },
  {
    id: 'doc',
    title: { vi: 'Documentary — Vùng cao', en: 'Documentary — Highlands' },
    meta: { vi: 'Phim tài liệu ngắn', en: 'Short documentary' },
    year: '2026',
    tag: 'personal',
    aspect: '16 / 9',
    poster: '/media/work/doc.jpg',
    preview: '/media/work/doc.mp4',
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const carouselProjects = projects.filter((p) => !p.featured);
