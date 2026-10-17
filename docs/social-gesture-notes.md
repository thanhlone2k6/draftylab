# Social Production — drifting loop rail + nested gestures

> 17/10 (later): items are viewed in place — **no lightbox**. The front slide's video auto-plays (loop) at the session volume level (50% by default; the in-place volume gauge on the video cards sets it) while the pointer/focus is on the group, muted otherwise; tap pauses/resumes; leaving the slide detaches the source. UI is minimal (name + ↗ link, hover-only per-group arrows, two rail arrows in the title row; arrows hidden on touch). See `decisions-log.md`.

(Updated 17/10/2026 after review: borderless, larger groups, slow right→left drift, pause on hover, endless loop.)

## Structure

- **Outer rail** (custom, `interactive/SocialBrandRail.tsx`, not React Bits): one row, native `overflow-x: auto` (touch/trackpad keep working), no scroll-snap. Brand order: DinhHouse → Lee Chloe → Kazaki → Goodci → Winnie → Marie → Porche.
- **Inner**: one React Bits **Depth Carousel per brand** (`interactive/SocialBrandCard.tsx`), now 310×388 cards (was 230×288), no frame/border/background around a group — name, counts, platform link, carousel and prev/next sit directly on the page.
- Desktop ≥1200px shows three groups (`(100% − 2·40px) / 3` each), tablet two, phone ~1.15.

## Drift and loop

| Behaviour | How |
|---|---|
| Slow right→left drift (~26 px/s) | rAF loop adds to a float position and writes `scrollLeft` (integer-rounded) |
| **Pauses on hover** (and keyboard focus inside the rail, mouse drag, touch, dialog open, off-screen, hidden tab) | `pointerenter/leave`, `focusin/out`, IntersectionObserver, `window.__dfl.isOpen()`, `visibilitychange` |
| Off for reduced motion and for touch-only devices (nothing to hover with — content moving under a finger causes mis-taps); arrows/swipe still work | `(hover:hover) and (pointer:fine)` + `prefers-reduced-motion` |
| **Endless loop, no clones** | Brands keep their DOM order; visual order is CSS `order` = `(i − offset) mod n`. Two cards are kept off-screen on the left; when `scrollLeft` reaches 3 steps the first card is moved to the end (`offset+1`, `flushSync`) and `scrollLeft −= step` in the same tick — no jump, carousel state is preserved. Going backwards mirrors this. |
| Rail arrows (wrap) | custom eased animation (520 ms) of the same float position; works through the wrap |
| Entry animation | When the rail first scrolls into view each group fades in (opacity + 16px + blur, 110 ms stagger). Server HTML is visible; only rails still below the fold at hydration are pre-hidden. |

## Who owns which gesture (unchanged)

| Input | Starts on | Moves | Implementation |
|---|---|---|---|
| Mouse drag | images (`[data-inner-gesture]`) | that carousel only | axis lock (8px) + `setPointerCapture` + `stopPropagation`; rail ignores these pointerdowns |
| Mouse drag | brand header / gaps | outer rail | window listeners, click suppressed after the drag; loop compensation applies to the drag origin |
| Touch swipe horizontal | images | that carousel | `touch-action: pan-y` |
| Touch swipe horizontal | header / gaps | outer rail | native scrolling; looping is deferred until the touch settles (350 ms) |
| Touch swipe vertical | anywhere | page | carousel cancels its drag when `|dy| > |dx|` |
| Wheel vertical | anywhere | page | carousel ignores wheel unless horizontal-dominant |
| Wheel horizontal | carousel | that carousel | `preventDefault` + `stopPropagation` |
| Tap neighbour / front card | carousel | bring forward / pause-resume the front video (images: nothing) | `onActivate`; never after a drag |
| Buttons | rail ← → | rail by one brand (wraps) | `aria-label="Thương hiệu trước/sau"` |
| Buttons | brand ‹ › | that carousel | `aria-label="Bài trước/sau của <Brand>"`, counter "3 / 11" |

Accessibility note: because the loop uses CSS `order`, DOM/tab order stays DinhHouse → Porche while the visual order rotates; focusing an off-screen card scrolls it into view natively.

## Tests (`tests/e2e/phase1.spec.ts`)

Frameless computed style; 3 groups at the start; every brand reachable and 16 arrow clicks (2+ laps) keep exactly 7 cards / 7 carousels; drift moves left slowly, **pauses while hovered**, resumes on leave; wrap moves a card to the end of the order; inner drag leaves the rail untouched; header drag leaves the carousel index untouched; vertical wheel scrolls the page; touch swipes (Chromium CDP). Real iOS/Android touch: **NOT TESTED ON REAL DEVICE.**
