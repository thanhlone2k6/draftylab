# HANDOFF — Drafty Lab (DFL2)

> Read me first. Update me before you finish any task that changes files. Keep it short.
> Last updated: 2026-10-19.

## What changed last session
- 2026-10-19 — **About card**: "DRAFTY LAB" text badge → owner wordmark image (`logo/logogog.png` → `public/media/brand/drafty-lab-wordmark.png`, 20px tall). Tags → `Marketing Partner` · `AI Hybrid Production`. The role line ("Founder & Creative Lead") is forced to ONE line (`white-space: nowrap`; `0.68rem` on the ≤899 layout so it fits the narrow ID column). `.fc__face img` / `.fc__head img` scoped to `.fc__head > img` so the portrait rule no longer squashes the badge — `FounderCard.tsx`, `components.css`, `content.ts`
- 2026-10-19 — **Quick Call section**: lead line removed from the CTA (`.qcta__lead`; `quickCall.subtitle` still used in the form), button → **"Trao đổi ngay"** — `QuickCallCTA.astro`, `content.ts`
- 2026-10-19 — **How I Work**: step names shortened — 01 → "Phân tích nhu cầu, mục tiêu và tệp khán giả", 02 → "Lên kế hoạch và triển khai", 04 → "Báo cáo và thống kê" (`name` in `content.ts`; ids/folders untouched)
- 2026-10-19 — **Mobile pass**: `#work` ⤢ button only shows once the preview runs + loading spinner; play/pause removed from the volume gauge; Case Studies 3 video cards in one 3-up row; bigger compare slider; stripped trusted-logo marquee; hero collapsed nav = one centred pill covering the lanyard strap — `VideoPosterCard.astro`, `VolumeOverlay.tsx`, `CaseVideoCard.*`, `CaseStudies.astro`, `BehindCreative.astro`, `PartnerLoop.tsx`, `PillNav.css`, `components.css`
- 2026-10-19 — **How I Work images**: one subfolder per step under `Cách tôi sẽ làm việc/` → `how-i-work` uses `brands` so ids are `how-i-work-<step>-iNN`; **images only** (the single video was cut to a still `0829(2).jpg` and the mp4 moved to `Cách tôi sẽ làm việc/video riêng/`, not scanned); HEIC handled via macOS `sips` (`decodedSource` in `build-media.mjs`) — `config.mjs`, `build-media.mjs`, `media-roles.json`, `media-sets.json`, `content.ts`, `build-media.test.mjs`

## Current state
- **Deployed** `main` = commit `99b3ee8` (2026-10-19) → https://draftylab.pages.dev. Push to `main` auto-builds (`npm run build:cf`) in ~2–3 min; no manual deploy.
- Works: 32 videos + hover preview + lightbox, 404, Turnstile on preview, lead → D1.
- Half-done: production email notification not verified end-to-end (needs a real lead with a Turnstile tick).
- Not done: `public/media/v1-temp/*` placeholders (portrait/partners) still in use; remote branch `dfl2-migration` still exists (merged).

## Next steps
1. Owner submits a test lead on the live site; check D1 (`notify=sent`) + Gmail; delete the test row.
2. Delete remote branch `dfl2-migration`; replace `v1-temp` placeholders when the owner supplies finals (`docs/unmapped-assets.md`).

## Gotchas
- **Dev server goes stale**: after changing `content.ts`/adding a component, HMR can serve the old file (or islands fail with `504 Outdated Optimize Dep`). Fix: kill it, `rm -rf node_modules/.vite .astro`, `npm run dev`.
- **Never re-enable `intro` on the Trusted-by `LogoLoop`** — it pre-hides every item and leaves the row blank/part-filled for ~1.15s (`.logoloop[data-intro]`, `PartnerLoop.tsx`). Check WebKit too (`npx playwright` ships the Safari engine).
- **How I Work source folders = the ids**: renaming a subfolder under `Cách tôi sẽ làm việc/` changes every id → update `media-roles.json` (`expectFile` guard fails the test on drift) + `content.ts` `mediaIds`. The section is **images-only** — a video in a step folder must be cut to a still (the old mp4 sits in `Cách tôi sẽ làm việc/video riêng/`). HEIC needs macOS `sips` (no HEVC plugin in this sharp).
- Run `astro check` (0 errors) + `npm run test:media` before pushing; copy/labels live in `src/data/content.ts`.
- `.mp4` is gitignored except `*-preview.*.mp4`; full 720p lives ONLY in R2 `draft2` (served by `functions/media/v2`). Never delete R2 `draft2` / `draftylab-media`.
- Preview and production share D1 + R2; other preview hosts fail Turnstile unless added to the widget.
- Secrets are set by the owner via `wrangler pages secret put`; never paste or commit them.
- Never touch V1 resources: R2 `draftylab-media`, project `draftylab-v2`, site `dinhhouse-website`, branch `backup-v1`, tag `v1-final-2026-10-17`.

## Layout (stable — point, don't copy)
- `src/` UI + content (`src/data/content.ts`), `functions/` API + media, `migrations/` D1 SQL, `scripts/` build/media tools, `deploy/` headers template, `docs/` reports.
- See `AGENTS.md`, `docs/UPDATE-GUIDE.md`, `docs/v1-rollback.md`.

## History (newest first, keep ~5–8)
- 2026-10-19 — About card: wordmark logo replaces the text badge; tags → Marketing Partner / AI Hybrid Production; Quick Call lead removed + button "Trao đổi ngay" — `FounderCard.tsx`, `components.css`, `content.ts`, `QuickCallCTA.astro`
- 2026-10-19 — How I Work: step names shortened (01, 02, 04) — `content.ts`
- 2026-10-19 — Mobile polish: video loading spinner + ⤢ on-tap only + no play button; case-study videos 3-up; bigger compare slider; simpler trusted marquee; hero nav = one centred pill — `VideoPosterCard.astro`, `VolumeOverlay.tsx`, `CaseVideoCard.*`, `CaseStudies.astro`, `BehindCreative.astro`, `PartnerLoop.tsx`, `PillNav.css`
- 2026-10-19 — About Founder: tag pills moved into the card under the role, greeting deleted — `FounderCard.tsx`, `AboutFounder.astro`, `components.css`
- 2026-10-19 — How I Work: one subfolder per step → ids `how-i-work-<step>-*`, Vietnamese step names, HEIC via `sips`, loose photos ignored — `config.mjs`, `build-media.mjs`, `media-roles.json`, `content.ts`
- 2026-10-18 — Case Studies 3 video cards; Social 20 picks; Quick Call form rework; Hero/PillNav/GlassSurface work; V1→V2 cutover (commit `a170b90` deployed) — see git log
