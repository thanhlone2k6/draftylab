// Central video host. All .mp4 files live on Cloudflare R2 — NEVER commit
// .mp4 files to git (Cloudflare Pages fails builds with files > 25MB).
// Posters (.jpg/.webp) and images stay in /public/media (all < 25MB).
// See AGENTS.md → "Media & Deploy Rule (R2 for videos)".

// TODO(R2): replace with the bucket's public domain after creation,
// e.g. 'https://media.draftylab.pages.dev' or 'https://<id>.r2.dev'.
export const R2_MEDIA_BASE = 'https://pub-e389a414549e4830882a9b251f7b95ec.r2.dev';

/** Build an absolute R2 URL for a video path like 'work/kz2.mp4'. */
export function r2(path: string): string {
  return `${R2_MEDIA_BASE}/${path}`;
}
