// Shared media-pipeline config. Source folders live in the DFL2 root (one
// level above website/) and are NEVER written to.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEBSITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DFL2_DIR = process.env.DFL2_DIR || path.resolve(WEBSITE_DIR, '..');
export const INTERNAL_DIR = path.join(WEBSITE_DIR, 'media-src');
export const INTERNAL_MANIFEST = path.join(INTERNAL_DIR, 'manifest.internal.json');
export const BUILD_CACHE = process.env.DFL2_BUILD_CACHE || path.join(INTERNAL_DIR, 'build-cache.json');
export const PUBLIC_MANIFEST = path.join(WEBSITE_DIR, 'src/data/media.public.json');
export const OUTPUT_DIR = path.join(WEBSITE_DIR, 'public/media/v2');
export const OUTPUT_URL = '/media/v2';

const HELP = 'Tôi có thể giúp gì cho bạn?';

// Section folders (relative to DFL2_DIR). `brands` maps folder name → stable id.
export const SECTIONS = [
  { id: 'gallery', dir: `${HELP}/Content & Video Editing Pack`, phase: 1 },
  {
    id: 'social',
    dir: `${HELP}/Social Production`,
    phase: 1,
    brands: [
      { folder: 'dinh house', id: 'dinhhouse', displayName: 'DinhHouse' },
      { folder: 'lee chloe', id: 'leechloe', displayName: 'Lee Chloe' },
      { folder: 'kazaki', id: 'kazaki', displayName: 'Kazaki' },
      { folder: 'goodci', id: 'goodci', displayName: 'Goodci' },
      { folder: 'winnie', id: 'winnie', displayName: 'Winnie' },
      { folder: 'marie', id: 'marie', displayName: 'Marie' },
      { folder: 'porche', id: 'porche', displayName: 'Porche' },
    ],
  },
  { id: 'behind-raw-final', dir: 'Behind the Creative/raw-final', phase: 2 },
  { id: 'behind-ai-workflow', dir: 'Behind the Creative/AI workflow', phase: 2 },
  { id: 'case-studies', dir: 'Case Studies + Results', phase: 2 },
  { id: 'how-i-work', dir: 'Cách tôi sẽ làm việc', phase: 2 },
];

export const EXPECTED_COUNTS = { socialVideos: 19, galleryVideos: 4 };

export const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
export const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v']);

/** Natural, locale-aware filename sort so ids stay stable between scans. */
export const byName = (a, b) => a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' });
