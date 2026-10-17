# HANDOFF — Drafty Lab (DFL2)

> Read me first. Update me before you finish any task that changes files.
> Last updated: 2026-10-18.

## What changed last session
- 2026-10-18 — Migrated V1 → V2: `main` fast-forwarded to DFL2 (commits up to `01b0631`); V1 kept at branch `backup-v1` + tag `v1-final-2026-10-17` — `docs/v1-rollback.md`
- 2026-10-18 — Cloudflare Pages `draftylab`: build command now `npm run build:cf`; secrets `TURNSTILE_SECRET`, `RESEND_API_KEY`, `RATE_SALT` set (prod), preview has no Resend key by design — Cloudflare dashboard, `wrangler.toml`
- 2026-10-18 — SEO fix (removed noindex, added canonical, `public/robots.txt`, `public/sitemap.xml`), removed "Prototype Phase 1" footer note — `src/layouts/BaseLayout.astro`, `src/data/content.ts`, `src/components/Footer.astro`
- 2026-10-18 — Shipped 6 small hover-preview mp4 in git (gitignore exception) so Git builds have them — `.gitignore`, `public/media/v2/**/*-preview.*.mp4`
- 2026-10-18 — Added `AGENTS.md`, `CLAUDE.md`, `docs/UPDATE-GUIDE.md` (push workflow for AI/humans)

## Current state
- Works: https://draftylab.pages.dev serves DFL2; push to `main` auto-deploys (verified); 32 videos, hover preview, lightbox, 404, Turnstile on preview, lead → D1 (verified on preview, test lead deleted; D1 has 0 rows).
- Half-done: email notification on PRODUCTION not yet verified end-to-end (needs a real lead with Turnstile tick; preview uses `LEAD_NOTIFY=none`).
- Not done / known: remote branch `dfl2-migration` still exists (merged, can delete after email test); `public/media/v1-temp/*` placeholder assets (logo, partners, portrait) still used; dashboard Bindings are read-only because `wrangler.toml` owns them.

## Next steps
1. Owner submits a test lead on https://draftylab.pages.dev; check D1 (`notify=sent`) and Gmail inbox; then delete the test row.
2. Delete remote branch `dfl2-migration` after step 1 (keep `backup-v1` and the tag forever).
3. Replace `v1-temp` placeholder assets/copy when owner supplies finals (`docs/unmapped-assets.md`).

## Gotchas
- Git rollback to V1 needs build command back to `npm run build` (V1 has no `build:cf`) — `docs/v1-rollback.md`.
- `.mp4` is gitignored except `*-preview.*.mp4`; the 26 full 720p videos live ONLY in R2 bucket `draft2` (served by `functions/media/v2`). Never delete the bucket.
- Preview and production share the same D1 and R2; preview hosts other than `draftylab.pages.dev`/`dfl2-migration...` fail Turnstile unless added to the widget's hostnames.
- Secrets are entered by the owner via `wrangler pages secret put`; never paste them in chat or commit them.
- Never touch V1 resources: R2 `draftylab-media`, project `draftylab-v2`, site `dinhhouse-website`.

## Layout (stable — point, don't copy)
- `src/` UI + content (`src/data/content.ts`), `functions/` API + media, `migrations/` D1 SQL, `scripts/` build/media tools, `deploy/` headers template, `docs/` reports.
- See `AGENTS.md`, `docs/UPDATE-GUIDE.md`, `docs/v1-rollback.md`.

## History (newest first, keep ~5–8)
- 2026-10-18 — Cutover to DFL2 on main, SEO/footer fix, AI guidance files — see above.
- 2026-10-17 — Phase 1–3 audit/backup/branch `dfl2-migration`, Turnstile + Resend setup on `draftylab-v2`, Cloudflare R2/D1 provisioned (earlier sessions) — `docs/phase3-3b-report.md`
