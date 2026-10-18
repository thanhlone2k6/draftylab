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
  // 2026-10-19: the owner re-sorted this section into one subfolder per step (the folder names
  // below). Each subfolder is scanned as its own group, so ids become `how-i-work-<step>-iNN/vNN`
  // and a step can never show another step's photos. The 5 loose photos still at the root are
  // intentionally not scanned (owner: "bỏ qua"). Folder names are stored NFC (APFS resolves them).
  {
    id: 'how-i-work',
    dir: 'Cách tôi sẽ làm việc',
    phase: 2,
    brands: [
      { folder: 'Phân tích nhu cầu, mục tiêu khách hàng và tệp khán giả', id: 'audience', displayName: 'Phân tích nhu cầu' },
      { folder: 'Lên kế hoạch + Triển khai kế hoạch quay', id: 'plan', displayName: 'Lên kế hoạch' },
      { folder: 'Lên lịch đăng bài', id: 'schedule', displayName: 'Lên lịch đăng bài' },
      { folder: 'Làm báo cáo và thống kê để tối ưu hiệu quả marketing', id: 'report', displayName: 'Báo cáo' },
    ],
  },
];

// 2026-10-18: the 19 Social Production videos were moved to `Social Production/video riêng`
// (outside the scanned brand folders) at the owner's request, so the section is images-only now.
// 2026-10-18 (later): the 50 social IMAGES were then parked in `Social Production/ảnh riêng` (flat,
// named `<folder> - <original name>`) for the owner to review. They were moved AFTER the last
// media:scan, so `src/data/media.public.json` + `public/media/v2/social/**` still carry them and the live
// site is unchanged — but a fresh `media:scan` + `media:build` will drop every social item and the section
// will render its heading only (see the `hasPhotos` guard in SocialProduction.astro). See HANDOFF.md.
export const EXPECTED_COUNTS = { socialVideos: 0, galleryVideos: 4 };

// .heic added 2026-10-19: the owner filed two iPhone HEIC photos into the "Lên lịch đăng bài"
// step; sharp reads HEIF fine, so they scan like any other image.
export const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif']);
export const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v']);

/** Natural, locale-aware filename sort so ids stay stable between scans. */
export const byName = (a, b) => a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' });
