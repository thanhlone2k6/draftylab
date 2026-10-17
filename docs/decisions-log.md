# Decisions log — user changes that supersede the original spec

| Date | Change requested by the user | Where | Spec item it overrides |
|---|---|---|---|
| 17/10 | Hero restyled after `DavidHDev/rbp-portfolio` (layout, Geist type, neutral palette, CSS fade / scale-unblur motion); Lanyard + Dot Grid Dense kept | `Hero.astro`, tokens | 01 Hero art direction |
| 17/10 | Floating **pill navigation** + rounded 4-corner **frame** like the reference site | `Header.astro`, `BaseLayout.astro` | 00.2 #2 “navigation thường, logo trái” |
| 17/10 | Spacing between sections tightened, **divider lines removed** (`--section-y`) | all sections | — |
| 17/10 | **Video Editing**: previews play on mouse hover (muted loop, ~1 MB clips), play button removed; click still opens the lightbox | `VideoPosterCard.astro` | 00.2 #4 “không hover-to-play” |
| 17/10 | **Raw → Final**: no lightbox; in-place preview on hover (tap toggles on touch) | `BehindCreative.astro` | 04.7 A (lightbox for raw/final) |
| 17/10 | **Social Production**: no frames, larger groups, slow right→left drift that pauses on hover, fade-in, endless loop | `SocialBrandRail.tsx` | 04.5 (static snap rail) — still one row, 3 groups visible, one Depth Carousel per brand |
| 17/10 | **AI Workflow** slider follows the cursor (no click/drag on desktop) | `CompareSlider.tsx` | 04.7 B (drag) — touch still drags with axis lock, keyboard unchanged |
| 17/10 | **How I Work**: lead sentence and hint removed | `HowIWork.astro` | — |
| 17/10 | **Social Production items are viewed in place — no zoom/lightbox.** Video on the front slide auto-plays (loop) at **50% volume** while the pointer is on the group (muted otherwise); tap pauses/resumes. Minimal UI: no section sentence, no hint pill, no counts, no tags/action buttons; only a small ↗ platform link, two rail arrows in the title row and per-group arrows that appear on hover | `SocialBrandCard.tsx`, `SocialSlideVideo.tsx`, `SocialBrandRail.tsx` | 04.5 (lightbox for posts), 04.5 text/controls |
| 17/10 | **Video Editing hover preview plays at 50% volume** (previews now carry audio; if the browser blocks sound it plays muted and switches the sound on at the first gesture) | `VideoPosterCard.astro` | — |
| 17/10 | **Behind the Creative**: everything half size (≈390 px tall), one centred composition with equal heights and air around it | `BehindCreative.astro` | — |
| 17/10 | **Touch: tapping a video card never opens the lightbox** — it plays the in-place preview with sound. The lightbox is reached through a small ⤢ button in the card corner (hidden on hover devices, where a click on the card still opens it as before) | `VideoPosterCard.astro`, `dialog-bootstrap.js` | 00.2 #4, the earlier “tap opens the lightbox” note |
| 17/10 | **Default volume is 50% everywhere** (the lightbox used to hard-code 80%) and **the level is shared**: it is the session level for hover/hover-free previews, the Social front slides and the lightbox | `volume-store.js`, `dialog-bootstrap.js`, `SocialSlideVideo.tsx` | — |
| 17/10 | **In-place volume gauge** (React Bits **SloshGauge**): while a preview runs, tapping the card again opens a liquid gauge over the video — the video behind it is blurred, the gauge also carries pause/play — instead of toggling the preview off. The level picked there follows the videos below | `VolumeOverlay.tsx`, `SloshGauge.tsx`, `VideoPosterCard.astro`, `components.css` | the earlier “tap toggles the preview” note |

Notes
- Hover previews load `*-preview.mp4` (≤12 s, 540p, 0.5–1.6 MB). The full 720p files load only on a click that opens the lightbox. Previews are skipped under `prefers-reduced-motion`.
- The gallery and social preview clips carry an AAC track; the Raw/Final preview clips are picture-only in the source, so the gauge there only changes the shared level for the other videos.
- Touch devices have no hover: tapping a gallery or Raw/Final card plays its preview in place (sound on), tapping it again opens the volume gauge, and the card's ⤢ button (gallery) opens the lightbox; the Social rail does not drift (swipe and arrows still loop).
- Browsers only allow sound after the visitor has interacted with the page; until then hover previews and Social videos play **muted** at the session level and the sound starts at the first click/key press. Only the hovered Social group is audible, so several groups never talk over each other.
- The Social videos stream the 720p files (range requests) only while their slide is in front and the group is on screen; moving to another slide detaches the source.

## Phase 3 — 3A (17/10/2026, local only)

- Plan approved by the user; the 10 questions were left unanswered, so provider-agnostic defaults were used (`phase3-3a-report.md`).
- New: shared lead validator, `/api/lead` Pages Function (Turnstile + D1 + rate limit + idempotency + Resend/Telegram adapters), `/media/v2` R2 Function, content-hashed media names, `build:deploy` dist preparation, CSP (report-only) generated from the real inline-script hashes, consent checkbox on the form.
- Nothing was created or published on Cloudflare; every wrangler command was `--local`.
- 17/10: 3A approved by the user. The user performs 3B themselves following `deployment-checklist.md`; the assistant does nothing on Cloudflare. The 10 plan questions are still unanswered (defaults in `phase3-3a-report.md`) — questions 1 (lead destination), 2 (domain) and 4 (V1 temporary assets) must be answered before 3C.

## Phase 3 — 3B/3C (17/10/2026)

- The user created R2 bucket `draft2` and asked the assistant to continue. Done with the user's wrangler login (OAuth, scopes include d1/pages/workers/r2): new D1 `draftylab-v2-leads`, new Pages project `draftylab-v2`, `RATE_SALT` secret, 26 videos uploaded to `draft2`, preview deployment at preview.draftylab-v2.pages.dev. V1 resources and the other Pages project in the account were only listed (read-only), never modified.
- CORS / custom domain for R2: checked, **not needed** (same-origin Function + binding). Recommend disabling the bucket's Public Development URL.
- Bugs found only on the real deployment and fixed: hover-preview clips 404 behind the `/media/v2` Function (now falls through to static); missing files returned the home page with 200 (added `404.html`).
- Turnstile and lead notifications still pending the owner (site key / secrets / destination).
- 17/10: lead notification chosen = email to thanhnguyenphotowork@gmail.com via Resend (backend only), subject `[DFL2] New Lead – <name>`, D1 kept as backup. Added an optional budget question (draft buckets) because the email must include a budget; the step count stays 4. The Turnstile screenshot exposed the secret key to the assistant — it was NOT used; rotating it is recommended (`lead-email-setup.md`).
