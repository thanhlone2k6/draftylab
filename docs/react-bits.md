# React Bits — section map (Phase 1)

Source: official registry `https://reactbits.dev/r/<Name>-TS-CSS.json` (TypeScript + plain CSS variant), fetched **2026-10-17**. Copied into `src/components/react-bits/`. Local edits are marked `// DFL2:` (TS) or `/* DFL2: */` (CSS).

| Section | Component | File | Registry deps | Version installed | Phase 1 | Fallback |
|---|---|---|---|---|---|---|
| 01 Hero background | **Dot Grid** — preset **Dense** | `react-bits/DotGrid.tsx` (+ `interactive/HeroDotGrid.tsx`) | — | — | ✅ | `paused` under reduced motion (static grid); no pointer interaction on touch devices; `dpr` 1 on mobile |
| 01 Hero founder | **Lanyard** | `react-bits/Lanyard.tsx` (+ `interactive/HeroLanyard.tsx`) | `three@^0.180.0` | three 0.186.1 | ✅ desktop ≥1024px, hover-capable, WebGL2, no reduced motion | Static portrait card (server-rendered; also the final UI on mobile / reduced motion) |
| 03 Video Editing | **Fade Content** | `react-bits/FadeContent.tsx` | `gsap@^3.13.0` | gsap 3.15.0 | ✅ heading + each card, `once`, 0.6s, blur 4, 80ms stagger by index | Content is visible without JS; reduced motion → no animation |
| 04 Social Production | **Depth Carousel** — one instance per brand | `react-bits/DepthCarousel.tsx` | `gsap@^3.13.0` | gsap 3.15.0 | ✅ 7 instances | Reduced motion: depth 80, tilt 0, blur 0, no tween; arrows + counter always available |
| 10 Quick Call | **Stepper** | `react-bits/Stepper.tsx` | `@hugeicons/react@^1.1.10`, `@hugeicons/core-free-icons@^4.3.3` | 1.1.10 / 4.3.5 | ✅ 4 steps, `linear`, controlled `step` | Reduced motion → fade only (built-in) |
| 02 Trusted By | **Animated Content** | `react-bits/AnimatedContent.tsx` | `gsap@^3.13.0` | gsap 3.15.0 | ✅ Phase 2 — logos row, once, 24px + blur 4 | Visible without JS; reduced motion → none |
| 05 Website & Landing Page | Animated Content (optional) | — | — | — | Not rendered: no real assets (`TODO: ASSETS_WEBSITE`) | — |
| 06–07 Behind / Case Studies | **Fade Content** | `react-bits/FadeContent.tsx` | `gsap` | — | ✅ Phase 2 — headings + cards, once | as above |
| 08 How I Work | **Folder** ×4 | `react-bits/Folder.tsx` (+ `interactive/ProcessFolder.tsx`) | — | — | ✅ Phase 2 — `client:only` (its SSR colours differed from the client), `draggable={false}`, `zoomOnClick={false}`, paper click → global lightbox | Text blurb + counts rendered server-side under each folder |
| 09 About | **Reflective Card** | `react-bits/ReflectiveCard.tsx` (+ `interactive/FounderCard.tsx`) | `@hugeicons/*` | 1.1.10 / 4.3.5 | ✅ Phase 2 — `webcam={false}`, **no camera access** (test asserts 0 `getUserMedia` calls); custom children = portrait + name/role (no fake ID data) | Static card on touch / <900px / reduced motion / no WebGL2 |

Not used (per spec): Dock, Rubber Segment, Light Rays, Counter, Tear Ticket, global Gradual Blur.

## Dot Grid "Dense" preset — verified values

From Background Studio's bundle (`reactbits.dev/assets/DotGrid-*.js`, export `PRESETS.dense`):

```
shape: circle, dotSize: 3, gap: 10, proximity: 170, strength: 1, bounce: 0.6, tension: 0.55,
returnDuration: 0.8, shockRadius: 320, shockStrength: 5, swell: 1.2, stretch: 0.5, glow: 0.6, fade: 0
```

Stored in `src/data/dotgrid-presets.ts`. A preset defines no colors; site theme gives `baseColor #34313c`, `activeColor #f5f3ee`. Hero overrides `fade: 0.35` only to soften the grid at the section edges (all other values are the preset).

## Local modifications

### DotGrid.tsx
- `shockIgnore` selector prop: a press on `a, button, input, [data-no-shock]` (CTAs, Lanyard) does not fire a click shockwave. Pointer tracking was already on `window` (passive) and the canvas is `pointer-events: none`, so the grid never blocks content.

### FadeContent.tsx
- Removed server-rendered `visibility: hidden` (content was invisible until JS ran).
- Elements already in the viewport when the island hydrates are left visible (no flash-out); only off-screen content is prepared and revealed once.

### DepthCarousel.tsx / .css (see `social-gesture-notes.md`)
1. Wheel handled only when horizontal-dominant; vertical wheel scrolls the page.
2. Pointer axis lock (8px): vertical intent releases to the page; horizontal intent captures and stops propagation (outer rail never moves at the same time).
3. Click after a drag is suppressed (original read `dragRef` after it was already cleared).
4. `onActivate(index)`: tap/click on the **front** card (or Enter) → opens a lightbox; tap on a neighbour still brings it forward.
5. Slides carry `id` + `kind` (`image` / `video` / `video-pending`) and a `renderOverlay` slot (play / zoom / "Chưa sẵn sàng").
6. `apiRef` (prev / next / goTo) so each brand renders labelled controls + counter outside the carousel.
7. Demo picsum images removed.
8. CSS: stage `pointer-events: none` — cards behind the front one sit at negative `translateZ` behind the stage plane, so in the original the stage swallowed clicks on them.
9. Initial card transforms rendered server-side (`computeCard`) so there is no stacked flash before hydration.
10. Lazy/async image decoding.

### Stepper.tsx / Lanyard.tsx
- Unmodified. Stepper is used controlled (`step`, `onStepChange`, `onFinalStepCompleted`, `nextButtonProps.disabled`); all form state and validation live in `interactive/QuickCallForm.tsx`.

## Hydration

| Island | Directive | Why |
|---|---|---|
| `MediaDialogHost` (video / image / Quick Call UI) | `client:load` | Must take over the dialog shell quickly; heavy Quick Call chunk is code-split and prefetched on idle |
| `FadeContent` (gallery) | `client:load` | Must hydrate while still off-screen to be able to animate in |
| `HeroDotGrid`, `HeroLanyard` | `client:visible` | Above the fold anyway; Lanyard's three.js chunk (≈580 KB) is a lazy import, desktop only |
| `SocialBrandRail` | `client:visible` (rootMargin 400px) | Carousels mount only for brands near the rail viewport |

First click before hydration is handled by the inline bootstrap, not by these islands.

## Hero style reference (user request, 17/10/2026)

Hero layout, type scale, palette and motion follow the React Bits Pro portfolio (`DavidHDev/rbp-portfolio`): two-column calm hero, Geist medium with tight tracking, muted lead (`foreground/65`), rounded-xl CTAs (solid + bordered card with arrow nudge on hover), FadeIn (opacity + 12px, 0.8s) for the copy and ScaleUnblur (scale 0.7→1, blur 20→0, 1s, ease `[0.22,1,0.36,1]`) for the visual — implemented as plain CSS animations (no `motion` dependency). Copy unchanged; Dot Grid Dense background and the Lanyard are kept. Palette tokens switched to neutral `#0a0a0a / #fafafa / #a3a3a3`; Geist (SIL OFL 1.1) via `@fontsource-variable/geist` (includes the Vietnamese subset) — this is the one web font whose license is verified.
Not taken from the reference: shader-flow backdrop (spec requires Dot Grid Dense), floating pill nav (spec requires a normal header), Lenis smooth scroll, theme toggle.

## Phase 2 notes

- **AnimatedContent.tsx**: same two local changes as FadeContent (no server-rendered `visibility:hidden`; content already in view at hydration stays visible).
- **Folder.tsx**: unmodified. Its server render used the default blue regardless of the `color` prop (hydration mismatch), so the island is `client:only="react"`; the surrounding copy and counts are server-rendered.
- **ReflectiveCard.tsx**: unmodified. Rendered without `videoSrc` (default plate); an optional tiny reflection loop can be supplied later. It contains two empty `<video>` elements with no `src` (never requests media).
- Non-React-Bits (spec): header (pill style by request), brand rail, **Compare Slider** (`interactive/CompareSlider.tsx`: pointer, touch with axis lock so vertical swipes scroll, keyboard `role=slider`).

## Update 17/10/2026

- Depth Carousel: scale-to-fit padding 120 → 40 and larger cards (310×388) in the Social rail.
- Hover previews (gallery, Raw/Final), the drifting loop rail, the pill nav, the frame and the compare slider are custom code, not React Bits (see `decisions-log.md`).
