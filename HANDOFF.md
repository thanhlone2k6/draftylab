# HANDOFF — Drafty Lab (DFL2)

> Read me first. Update me before you finish any task that changes files. Keep it short.
> Last updated: 2026-10-19.

## What changed last session
- 2026-10-19 — **Trusted-by (trusted logo strip)**: phones ≤767px no longer use the LogoLoop engine. `TrustedBy.astro` now renders a plain CSS marquee (3 identical rows, `-33.3333%` translate, 20s; equal `100×52` slot per logo, `max 88×40` contained; 26px edge mask; `prefers-reduced-motion` → wrapped static row, no fade) and the island is gated with `client:media="(min-width: 768px)"` so phones load no engine/hydration. Mobile items are **images only, not links** (a moving row was not tappable). `PartnerLoop.tsx` dropped its `simple`/matchMedia phone branch → desktop dock preset only.
- 2026-10-19 — **Trusted-by caption one line on phones** (owner request): `.tb__title` → `font-size: min(0.95rem, 2.85vw); max-width: none` inside `@media (max-width: 767px)`. Not `nowrap` — sized to fit, so a wider fallback font wraps instead of overflowing the page.

## Current state
- **Uncommitted**: the two edits above (`TrustedBy.astro`, `PartnerLoop.tsx`) are NOT committed/pushed yet. `main` is still `99b3ee8` (= live).
- Works: 32 videos + hover preview + lightbox, 404, Turnstile on preview, lead → D1. Trusted-by verified in WebKit at 320/360/375/390/430/700/767/768/1280 + no-JS: title 1 line, row even, marquee loops seamlessly, no page overflow, island does not hydrate on phones, desktop dock unchanged (animates once on screen, idles off-screen).
- Half-done: production email notification not verified end-to-end (needs a real lead with a Turnstile tick).
- Not done: `public/media/v1-temp/*` placeholders (portrait/partners) still in use; remote branch `dfl2-migration` still exists (merged).

## Next steps
1. Owner decides: commit + push these Trusted-by changes (push to `main` = live deploy in ~2–3 min).
2. Owner submits a test lead on the live site; check D1 (`notify=sent`) + Gmail; delete the test row.
3. `tests/e2e/phase2.spec.ts` "Trusted By shows all partners..." is **stale since 2026-10-18** (targets `.tb__item`, `.tb__row`, `a.tb__item` — classes that no longer exist; fails on every project). Rewrite against `.tb__marq-item` (mobile) / `.logoloop__item` (desktop) or delete it.
4. Delete remote branch `dfl2-migration`; replace `v1-temp` placeholders when the owner supplies finals (`docs/unmapped-assets.md`).

## Gotchas
- **Trusted-by = two implementations, one data source** (`src/data/partners.ts`): phones = CSS marquee in `TrustedBy.astro` (scoped styles), ≥768px = `PartnerLoop.tsx` (LogoLoop dock preset). Edit logos/treatments in both. Do **not** put `client:visible`/`client:load` on `PartnerLoop` — `client:media="(min-width: 768px)"` is what keeps the engine off phones.
- The mobile marquee needs ≥2 rows of track: 3 rows exist because 2 rows (700px each) run out of track at 700–767px and show a blank strip at the right edge. Keep the `-33.3333%` in sync with the row count.
- **Never re-enable `intro` on the Trusted-by `LogoLoop`** — it pre-hides every item and leaves the row blank/part-filled for ~1.15s (`.logoloop[data-intro]`, `PartnerLoop.tsx`). Check WebKit too (`npx playwright` ships the Safari engine).
- **Dev server goes stale**: after changing `content.ts`/adding a component, HMR can serve the old file (or islands fail with `504 Outdated Optimize Dep`). Fix: kill it, `rm -rf node_modules/.vite .astro`, `npm run dev`.
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
- 2026-10-19 — Trusted-by rebuilt for phones: CSS marquee + `client:media` desktop dock; caption one line — `TrustedBy.astro`, `PartnerLoop.tsx`
- 2026-10-19 — About card: wordmark logo replaces the text badge; tags → Marketing Partner / AI Hybrid Production; Quick Call lead removed + button "Trao đổi ngay" — `FounderCard.tsx`, `components.css`, `content.ts`, `QuickCallCTA.astro`
- 2026-10-19 — How I Work: step names shortened (01, 02, 04) — `content.ts`
- 2026-10-19 — Mobile polish: video loading spinner + ⤢ on-tap only + no play button; case-study videos 3-up; bigger compare slider; simpler trusted marquee; hero nav = one centred pill — `VideoPosterCard.astro`, `VolumeOverlay.tsx`, `CaseVideoCard.*`, `CaseStudies.astro`, `BehindCreative.astro`, `PartnerLoop.tsx`, `PillNav.css`
- 2026-10-19 — About Founder: tag pills moved into the card under the role, greeting deleted — `FounderCard.tsx`, `AboutFounder.astro`, `components.css`
- 2026-10-19 — How I Work: one subfolder per step → ids `how-i-work-<step>-*`, Vietnamese step names, HEIC via `sips`, loose photos ignored — `config.mjs`, `build-media.mjs`, `media-roles.json`, `content.ts`
- 2026-10-18 — Case Studies 3 video cards; Social 20 picks; Quick Call form rework; Hero/PillNav/GlassSurface work; V1→V2 cutover (commit `a170b90` deployed) — see git log
