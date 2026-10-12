// Central video host. All .mp4 files live on Cloudflare R2 — NEVER commit
// .mp4 files to git (Cloudflare Pages fails builds with files > 25MB).
// Posters (.jpg/.webp) and images stay in /public/media (all < 25MB).
// See AGENTS.md → "Media & Deploy Rule (R2 for videos)".
//
// ── Mode switching ──────────────────────────────────────────────────────
// Set PUBLIC_MEDIA_MODE env var (in Cloudflare Dashboard or .env) to:
//   "primary"  (default) — uses r2.dev public URL
//   "fallback"           — uses /media/ proxy via Pages Function + R2 binding
//
// When changing modes, just update the env var and redeploy — no code changes.

const R2_MEDIA_BASE = 'https://pub-e389a414549e4830882a9b251f7b95ec.r2.dev';

/** Current media delivery mode. */
export type MediaMode = 'primary' | 'fallback';

/**
 * Resolve the active media mode.
 * In Astro, `import.meta.env.PUBLIC_*` vars are available at build time
 * (injected via .env or Cloudflare Dashboard → Environment Variables).
 * Falls back to 'primary' when unset.
 */
function resolveMode(): MediaMode {
  const mode = import.meta.env.PUBLIC_MEDIA_MODE;
  if (mode === 'fallback') return 'fallback';
  return 'primary';
}

/** The active mode, resolved once at build time. */
export const MEDIA_MODE: MediaMode = resolveMode();

/**
 * Build an absolute video URL.
 *
 * primary:   https://<r2-public>.r2.dev/<path>
 * fallback:  /media/<path>
 *
 * @param path  Relative path like 'work/kz2.mp4'
 */
export function r2(path: string): string {
  if (MEDIA_MODE === 'fallback') {
    return `/media/${path}`;
  }
  return `${R2_MEDIA_BASE}/${path}`;
}
