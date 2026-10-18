# HANDOFF — Drafty Lab (DFL2)

> Read me first. Update me before you finish any task that changes files. Keep it short.
> Last updated: 2026-10-19.

## What changed last session
- 2026-10-19 — **iOS volume fixed for real.** iOS Safari keeps `HTMLMediaElement.volume` read-only (it always reads 1), so the in-place gauge wrote the store and `el.volume` but the speaker never changed ("điều chỉnh âm thanh ở mobile thì không áp dụng gì cả", owner). New inline bridge `src/scripts/audio-level.js` (`window.__dflAudio`): where the browser honours `volume` it does exactly what the old code did; where it does not, the element's audio is re-routed through a Web Audio **gain** (`createMediaElementSource`, WebKit bug 237322) with `navigator.audioSession.type = 'playback'` so the ringer switch does not mute it. Every call site (`VideoPosterCard.astro`, `dialog-bootstrap.js`, `VideoLightbox.tsx`, `SocialSlideVideo.tsx`, `CaseVideoCard.tsx`) now goes through `applyMediaVolume` / `applySessionVolume` (`src/lib/volume.ts`). The lightbox also no longer turns a 0 % level into 50 % (`|| 0.5` → `??`).
- 2026-10-19 — **Trusted-by: Saraya St. Laurent removed** (owner) → 6 partners (`src/data/partners.ts`); phones and the desktop dock both follow the one data source. `saraya.webp` left on disk (now unused).
- 2026-10-19 — **Tests**: new `tests/e2e/audio-ios.spec.ts` (fakes iOS by making `volume` read-only in an init script, then watches the gain follow the gauge; green on all 4 projects incl. WebKit). Rewrote the stale phase-2 "Trusted By" test (old `.tb__item`/`.tb__row` classes) against `.tb__marq-item` (phones, images only, no links) / `.logoloop__content` (desktop dock, 6 names + safe links) — it passes now.

## Current state
- **Not pushed yet** — the changes above are in the working tree (`main` is still `cff00df`). Local flow passes: `build:cf`, `check` (0 errors), `check:functions`, `test:unit` (29), `tests/e2e/audio-ios.spec.ts` + the rewritten Trusted-By test (4/4 projects each).
- Works: 32 videos + hover preview + lightbox, 404, Turnstile on preview, lead → D1; Trusted-by 6 partners on phones (CSS marquee) and desktop (LogoLoop dock); the volume gauge applies on the iOS path (gain) and on the native path (desktop/Android) with no behaviour change.
- **Needs a real iPhone check** (owner): preview sound follows the gauge, and it stays audible with the silent switch on. `navigator.audioSession` needs Safari 16.4+; below that the gauge works but follows the silent switch. Playwright's WebKit is desktop WebKit — it cannot prove the real-iOS read-only behaviour, which is why the spec fakes it.
- Pre-existing e2e failures (identical with the change stashed, so not from this session): `phase1.spec.ts` "Volume (touch)" (2.2m timeout), lightbox "controls, next/prev" and "focus is trapped", most of the social-rail tests, "nav links point to sections…". They hang on selectors/clicks under the sticky nav — worth a sweep of their own.

## Next steps
1. Push `main` (auto-builds → verify live in WebKit), then ask the owner to test the gauge on a real iPhone (silent switch on/off).
2. Sweep the pre-existing e2e failures listed above (they are not caused by this work but they hide real ones).
3. Owner submits a test lead on the live site; check D1 (`notify=sent`) + Gmail; delete the test row.
4. Delete remote branch `dfl2-migration`; replace the `v1-temp` placeholders (`docs/unmapped-assets.md`). Trusted-by now lists 6 partners — confirm the final set/order with the owner.

## Gotchas
- **Never set `el.volume` directly for a `<video>` we care about** — go through `applyMediaVolume` / `applySessionVolume` (`src/lib/volume.ts`) or `window.__dflAudio.apply(el, level, muted)`. A raw `el.volume = x` is silently ignored on iOS, which is exactly the bug this session fixed.
- The bridge keeps the routed element at `volume = 1` and lets the gain carry the level (never attenuate twice). Muted elements are never routed (they are silent anyway) and routing waits for the first pointer/key gesture — an `AudioContext` may not start outside one, and routing into a suspended context would be silent.
- A routed element gets a `volumechange` listener that mirrors `muted` into the gain, so code that only sets `el.muted` (the lightbox's own button) still works on iOS.
- Media must stay **same-origin** for the gain path: `createMediaElementSource` outputs *silence* for CORS-cross-origin media. `/media/v2/*` is same-origin, so fine.
- **Trusted-by = two implementations, one data source** (`src/data/partners.ts`): phones = CSS marquee in `TrustedBy.astro` (6 partners × 3 rows = 18 `.tb__marq-item`, `-33.3333%` translate; keep the row count in sync with the percentage), ≥768px = `PartnerLoop.tsx` (LogoLoop dock). Do **not** put `client:visible`/`client:load` on `PartnerLoop` — `client:media="(min-width: 768px)"` is what keeps the engine off phones. Never re-enable `intro` on that LogoLoop.
- **Dev server goes stale**: after changing `content.ts`/adding a component, HMR can serve the old file (or islands fail with `504 Outdated Optimize Dep`). Fix: kill it, `rm -rf node_modules/.vite .astro`, `npm run dev`.
- `npm run test:e2e` needs a **plain `npm run build`** first: `build:cf` runs `prepare-dist`, which moves the 25 full 720p videos out of `dist/` for R2, so the lightbox tests hang against that build.
- **How I Work source folders = the ids**: renaming a subfolder under `Cách tôi sẽ làm việc/` changes every id → update `media-roles.json` (`expectFile` guard fails the test on drift) + `content.ts` `mediaIds`. The section is **images-only**; HEIC needs macOS `sips`.
- Run `astro check` (0 errors) + `npm run test:media` before pushing; copy/labels live in `src/data/content.ts`.
- `.mp4` is gitignored except `*-preview.*.mp4`; full 720p lives ONLY in R2 `draft2` (served by `functions/media/v2`). Never delete R2 `draft2` / `draftylab-media`.
- Preview and production share D1 + R2; other preview hosts fail Turnstile unless added to the widget.
- Secrets are set by the owner via `wrangler pages secret put`; never paste or commit them.
- Never touch V1 resources: R2 `draftylab-media`, project `draftylab-v2`, site `dinhhouse-website`, branch `backup-v1`, tag `v1-final-2026-10-17`.

## Layout (stable — point, don't copy)
- `src/` UI + content (`src/data/content.ts`), `functions/` API + media, `migrations/` D1 SQL, `scripts/` build/media tools, `deploy/` headers template, `docs/` reports.
- See `AGENTS.md`, `docs/UPDATE-GUIDE.md`, `docs/v1-rollback.md`.

## History (newest first, keep ~5–8)
- 2026-10-19 — iOS volume bridge (Web Audio gain + `audioSession.type`), lightbox 0 % fix, Saraya removed from Trusted-by, `audio-ios.spec.ts` + rewritten Trusted-By test
- 2026-10-19 — Trusted-by rebuilt for phones: CSS marquee + `client:media` desktop dock; caption one line — `TrustedBy.astro`, `PartnerLoop.tsx`
- 2026-10-19 — About card: wordmark logo replaces the text badge; tags → Marketing Partner / AI Hybrid Production; Quick Call lead removed + button "Trao đổi ngay" — `FounderCard.tsx`, `components.css`, `content.ts`, `QuickCallCTA.astro`
- 2026-10-19 — Mobile polish: video loading spinner + ⤢ on-tap only + no play button; case-study videos 3-up; bigger compare slider; simpler trusted marquee; hero nav = one centred pill — `VideoPosterCard.astro`, `VolumeOverlay.tsx`, `CaseVideoCard.*`, `CaseStudies.astro`, `BehindCreative.astro`, `PartnerLoop.tsx`, `PillNav.css`
- 2026-10-19 — How I Work: one subfolder per step → ids `how-i-work-<step>-*`, Vietnamese step names, HEIC via `sips`, loose photos ignored — `config.mjs`, `build-media.mjs`, `media-roles.json`, `content.ts`
- 2026-10-18 — Case Studies 3 video cards; Social 20 picks; Quick Call form rework; Hero/PillNav/GlassSurface work; V1→V2 cutover (commit `a170b90` deployed) — see git log
