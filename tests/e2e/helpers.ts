import type { Locator, Page, Request } from '@playwright/test';

export const isMp4 = (r: Request) => /\.mp4(\?|$)/i.test(r.url());

export function trackMp4(page: Page) {
  const urls: string[] = [];
  page.on('request', (r) => {
    if (isMp4(r)) urls.push(r.url());
  });
  return urls;
}

export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

export const dialog = (page: Page) => page.locator('#dfl-dialog');

/** The small ⤢ button that opens a poster card's lightbox on touch devices (a sibling of the card). */
export const cardExpand = (card: Locator) => card.locator('xpath=..').locator('.vcard__expand');

/** Open a poster card's lightbox. Touch devices never open it by tapping the card itself (that plays the
 *  in-place preview and then the volume gauge), so they use the card's ⤢ button; hover devices click the card. */
export async function openCardLightbox(card: Locator, mobile: boolean) {
  await (mobile ? cardExpand(card) : card).click();
}

export async function scrollToId(page: Page, id: string) {
  await page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ behavior: 'instant', block: 'start' }), id);
}

/** Wait until islands have hydrated (Astro removes `ssr`). Default: the client:load islands;
 *  client:visible islands hydrate only once scrolled into view — pass a selector for those. */
export async function waitHydrated(page: Page, selector = 'astro-island[client="load"]') {
  await page.waitForFunction((sel) => Array.from(document.querySelectorAll(sel)).every((i) => !i.hasAttribute('ssr')), selector);
}

/** Chromium-only touch swipe via CDP (Playwright has no swipe API). */
export async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 12) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from.x, from.y) });
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x, y) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

export const waitRail = (page: Page) => waitHydrated(page, 'astro-island[component-url*="SocialBrandRail"]');
export const textOf = (page: Page, selector: string) => page.locator(selector).evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());

/** Left edge of a brand card inside the rail viewport (stays valid across the loop's scrollLeft compensation). */
export const cardLeft = (page: Page, brand: string) =>
  page.evaluate((b) => {
    const rail = document.querySelector('.srail__track')!.getBoundingClientRect();
    return Math.round(document.querySelector(`.sb[data-brand="${b}"]`)!.getBoundingClientRect().left - rail.left);
  }, brand);

/** Brands whose card is fully inside the rail viewport right now. */
export const fullyVisibleBrands = (page: Page) =>
  page.evaluate(() => {
    const rail = document.querySelector('.srail__track')!.getBoundingClientRect();
    return Array.from(document.querySelectorAll<HTMLElement>('.sb'))
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.left >= rail.left - 1 && r.right <= rail.right + 1;
      })
      .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      .map((c) => c.dataset.brand!);
  });

/** Brands whose card is at least 70% inside the rail viewport, left to right. */
export const mostlyVisibleBrands = (page: Page) =>
  page.evaluate(() => {
    const rail = document.querySelector('.srail__track')!.getBoundingClientRect();
    return Array.from(document.querySelectorAll<HTMLElement>('.sb'))
      .map((c) => {
        const r = c.getBoundingClientRect();
        const vis = Math.max(0, Math.min(r.right, rail.right) - Math.max(r.left, rail.left)) / r.width;
        return { b: c.dataset.brand!, vis, left: r.left };
      })
      .filter((c) => c.vis >= 0.7)
      .sort((a, b) => a.left - b.left)
      .map((c) => c.b);
  });

/** Park the mouse over the rail's empty top bar so the drift is paused for the rest of the test. */
export async function pauseRail(page: Page) {
  const box = (await page.locator('.srail__track').boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 4);
}
