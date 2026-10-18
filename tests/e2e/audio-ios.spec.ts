// Regression guard for the owner report of 2026-10-19: "khi điều chỉnh âm thanh ở mobile thì không áp dụng gì cả".
// iOS Safari keeps `HTMLMediaElement.volume` read-only (it always reads 1 — Apple, "Safari HTML5 Audio and
// Video Guide"), so a level that only reaches `el.volume` is inaudible there. src/scripts/audio-level.js
// detects that and drives the level through a Web Audio gain instead. The test fakes iOS *before any page
// script runs* (the same probe the bridge uses therefore sees a read-only `volume`) and watches the gain
// follow the gauge. Runs on all projects, `@webkit` included: with `volume` neutralised the bridge takes
// the iOS path on every engine, and WebKit is the engine the site actually meets on an iPhone.
import { expect, test } from '@playwright/test';
import { scrollToId, waitHydrated } from './helpers';

const isMobile = (name: string) => name.startsWith('mobile');

declare global {
  interface Window {
    /** Every gain the page built (filled by `fakeIos`), used to read the level the bridge applied. */
    __gains?: GainNode[];
  }
}

/** iOS Safari behaviour + a record of every gain the page builds, so the test can read the applied level. */
const fakeIos = () => {
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    configurable: true,
    get() {
      return 1;
    },
    set() {},
  });
  const list: GainNode[] = [];
  window.__gains = list;
  const globals = window as unknown as Record<string, typeof AudioContext | undefined>;
  for (const key of ['AudioContext', 'webkitAudioContext']) {
    const Ctor = globals[key];
    if (!Ctor?.prototype?.createGain) continue;
    const orig = Ctor.prototype.createGain;
    Ctor.prototype.createGain = function (this: AudioContext) {
      const node = orig.call(this);
      list.push(node);
      return node;
    };
  }
};

const gains = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window.__gains ?? []).map((g) => Number(g.gain.value.toFixed(2))));

test('@webkit the gauge level reaches the audio when `video.volume` is read-only (iOS)', async ({ page }, info) => {
  await page.addInitScript(fakeIos);
  await page.goto('/', { waitUntil: 'networkidle' });
  await waitHydrated(page);
  await scrollToId(page, 'work');

  // The bridge noticed the browser does not honour `volume`, so it is on the gain path.
  expect(await page.evaluate(() => window.__dflAudio?.settable)).toBe(false);

  const card = page.locator('#work .vcard[data-preview-src]').first();
  const preview = page.locator('#work video.vcard__preview').first();
  const tap = async () => (isMobile(info.project.name) ? card.tap() : card.click());

  await tap();
  await expect(card).toHaveAttribute('data-previewing', '');
  // Routed: one gain, at the session level — and the element stays at 1 (iOS pins it there).
  expect(await gains(page)).toEqual([0.5]);
  expect(await preview.evaluate((el: HTMLVideoElement) => ({ muted: el.muted, volume: el.volume }))).toEqual({ muted: false, volume: 1 });

  await tap();
  const gauge = page.locator('#work .vol');
  await expect(gauge).toBeVisible();
  const tank = (await gauge.locator('.slosh-gauge').boundingBox())!;
  const cx = tank.x + tank.width / 2;

  // Drag down: the gain follows the gauge (a plain `el.volume` write would have changed nothing here).
  await page.mouse.move(cx, tank.y + tank.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(cx, tank.y + tank.height * 0.85, { steps: 8 });
  await page.mouse.up();
  const store = await page.evaluate(() => window.__dflVolume!.get());
  expect(store).toBeGreaterThan(0.1);
  expect(store).toBeLessThan(0.5);
  expect(await gains(page)).toEqual([Number(store.toFixed(2))]);

  // Dragged past the bottom: level 0 silences the preview through the gain (and mutes the element).
  await page.mouse.move(cx, tank.y + tank.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(cx, tank.y + tank.height + 40, { steps: 8 });
  await page.mouse.up();
  expect(await gains(page)).toEqual([0]);
  expect(await preview.evaluate((el: HTMLVideoElement) => el.muted)).toBe(true);
});
