import { test, expect } from '@playwright/test';
import { dialog, scrollToId, swipe, trackConsoleErrors, trackMp4, waitHydrated } from './helpers';

const isMobile = (name: string) => name.startsWith('mobile');

test.describe('phase 2 sections @webkit', () => {
  test('page order, nav targets, no Website section while it has no real assets', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const ids = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(['top', 'trusted', 'work', 'social', 'behind', 'results', 'process', 'about', 'contact']);
    expect(await page.locator('#website').count()).toBe(0);
    for (const h of ['#work', '#social', '#results', '#about']) expect(await page.locator(h).count(), h).toBe(1);
  });

  test('Trusted By: phones run the still marquee (images only), the desktop dock keeps names + safe links', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'trusted');
    await page.waitForTimeout(900);

    if (isMobile(info.project.name)) {
      // Phones (≤767px): the CSS marquee — the 6 partners repeated in 3 identical rows, images only.
      // Deliberately no links: the row moves, so a tap target would be unusable (owner, 2026-10-19).
      await expect(page.locator('#trusted .tb__marq-item')).toHaveCount(18);
      expect(await page.locator('#trusted .tb__marq-item img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
      await expect(page.locator('#trusted .tb__marq a')).toHaveCount(0);
      await expect(page.locator('#trusted .tb__marq')).toBeVisible();
      await expect(page.locator('#trusted .tb__dock')).toBeHidden();
    } else {
      // Desktop (≥768px): the React Bits dock — one anchor per partner, names on hover, safe new-tab links.
      const names = await page.locator('#trusted .logoloop__content[aria-label]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('aria-label')))]);
      expect(names).toEqual(['Kazaki Ramen', 'Lee Chloe Coffee', 'Good Ci', 'Maison', 'Dinh House', 'Winnie']);
      const rels = await page.locator('#trusted a.logoloop__content').evaluateAll((as) => as.map((a) => [a.getAttribute('target'), a.getAttribute('rel')]));
      expect(rels.length).toBeGreaterThanOrEqual(names.length);
      for (const [t, r] of rels) {
        expect(t).toBe('_blank');
        expect(r).toContain('noopener');
      }
      await expect(page.locator('#trusted .tb__dock')).toBeVisible();
      await expect(page.locator('#trusted .tb__marq')).toBeHidden();
    }
  });

  test('Raw → Final: no lightbox — hover previews in place; touch tap plays then opens the volume gauge; no play button', async ({ page }, info) => {
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await scrollToId(page, 'behind');
    expect(mp4).toEqual([]);
    const cards = page.locator('#behind .vcard');
    await expect(cards).toHaveCount(2);
    expect(await page.locator('#behind .vcard__play').count()).toBe(0);
    for (const c of await cards.all()) expect(await c.getAttribute('data-dfl-open')).toBeNull(); // not wired to the lightbox
    const v = page.locator('#behind video.vcard__preview');
    const touch = isMobile(info.project.name);
    const play = async (i: number) => (touch ? cards.nth(i).tap() : cards.nth(i).hover());
    await play(0);
    await expect.poll(() => v.first().evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > 0.2), { timeout: 15_000 }).toBe(true);
    await expect(cards.nth(0)).toHaveAttribute('data-previewing', '');
    expect(await v.first().evaluate((el: HTMLVideoElement) => el.loop)).toBe(true);
    // Sound: the session level (default 50%). A tap is a user gesture, so touch really plays unmuted; a bare
    // hover cannot, so the preview stays muted until the first gesture.
    expect(await v.first().evaluate((el: HTMLVideoElement) => el.volume)).toBe(0.5);
    expect(await v.first().evaluate((el: HTMLVideoElement) => el.muted)).toBe(!touch);
    expect(await v.first().evaluate((el: HTMLVideoElement) => el.videoWidth / el.videoHeight)).toBeGreaterThan(0.7); // raw is 3:4 portrait
    await expect(dialog(page)).toBeHidden();
    // clicking with a mouse never opens a dialog either
    if (!isMobile(info.project.name)) await cards.nth(0).click();
    await expect(dialog(page)).toBeHidden();
    // second card: previews its own clip; the first one stops (only one preview at a time)
    await play(1);
    await expect.poll(() => page.locator('#behind video.vcard__preview[src]').count()).toBe(1);
    await expect.poll(() => v.last().evaluate((el: HTMLVideoElement) => el.videoWidth / el.videoHeight), { timeout: 15_000 }).toBeLessThan(0.6); // 9:16
    expect(mp4.length).toBeGreaterThan(0);
    expect(mp4.every((u) => /-preview\.[0-9a-f]{8}\.mp4/.test(u)), mp4.join(',')).toBe(true);
    expect(mp4.some((u) => /behind-raw-final-v01-preview\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);
    expect(mp4.some((u) => /behind-raw-final-v02-preview\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);
    if (touch) {
      // A second tap on a running preview opens the in-place volume gauge (docs/decisions-log.md, 17/10).
      await cards.nth(1).tap();
      const gauge = page.locator('#behind .vol');
      await expect(gauge).toBeVisible();
      await expect(gauge.locator('.slosh-gauge')).toBeVisible();
      await expect(cards.nth(1)).toHaveAttribute('data-volume-open', '');
      // The gauge's pause control stops the preview (tap no longer toggles it off).
      await gauge.locator('.vol__toggle').click();
      await expect.poll(() => v.last().evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
      // Escape closes the gauge and cleans the card up.
      await page.keyboard.press('Escape');
      await expect(gauge).toBeHidden();
      await expect(cards.nth(1)).not.toHaveAttribute('data-volume-open', '');
    } else {
      await page.mouse.move(5, 5);
      await expect(page.locator('#behind video.vcard__preview[src]')).toHaveCount(0);
    }
  });

  test('Behind the Creative: half-size, centred, away from the edges, items balanced', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'behind');
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const box = (sel: string) => { const r = document.querySelector(sel)!.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const items = [...document.querySelectorAll('#behind .vcard__media, #behind .cmp__frame')].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, h: r.height, w: r.width }; });
      return { cont: box('#behind .container-x'), items, vw: innerWidth };
    });
    expect(m.items).toHaveLength(3);
    const minL = Math.min(...m.items.map((i) => i.l));
    const maxR = Math.max(...m.items.map((i) => i.r));
    expect(minL - m.cont.l, 'left breathing room').toBeGreaterThanOrEqual(isMobile(info.project.name) ? 8 : 24);
    expect(m.cont.r - maxR, 'right breathing room').toBeGreaterThanOrEqual(isMobile(info.project.name) ? 8 : 24);
    if (!isMobile(info.project.name)) {
      // centred as one composition
      expect(Math.abs((minL + maxR) / 2 - (m.cont.l + m.cont.r) / 2)).toBeLessThan(20);
      // equal heights → balanced row; ≈ half of the previous 780px-tall final video
      const hs = m.items.map((i) => i.h);
      expect(Math.max(...hs) - Math.min(...hs)).toBeLessThan(2);
      expect(hs[0]).toBeLessThanOrEqual(400);
      expect(m.items[2].w).toBeLessThanOrEqual(340);
    }
  });

  test('Compare slider: follows the mouse without clicking; keyboard; aria values', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'behind');
    await page.locator('.cmp__frame').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800); // initial nudge animation
    const handle = page.getByRole('slider', { name: /So sánh ảnh gốc/ });
    await expect(handle).toBeVisible();
    await handle.focus();
    await page.keyboard.press('Home');
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('End');
    await expect(handle).toHaveAttribute('aria-valuenow', '100');
    await page.keyboard.press('ArrowLeft');
    expect(Number(await handle.getAttribute('aria-valuenow'))).toBeLessThan(100);
    const frame = await page.locator('.cmp__frame').boundingBox();
    if (!isMobile(info.project.name)) {
      // no button pressed: the handle simply tracks the cursor
      await page.mouse.move(frame!.x + frame!.width * 0.5, frame!.y + frame!.height * 0.5);
      await page.mouse.move(frame!.x + frame!.width * 0.2, frame!.y + frame!.height * 0.5, { steps: 8 });
      await expect(handle).toHaveAttribute('aria-valuenow', /^(1\d|2\d)$/);
      await page.mouse.move(frame!.x + frame!.width * 0.8, frame!.y + frame!.height * 0.5, { steps: 8 });
      const v = Number(await handle.getAttribute('aria-valuenow'));
      expect(v).toBeGreaterThan(70);
      expect(v).toBeLessThan(90);
      const clip = await page.locator('.cmp__img--before').evaluate((el) => getComputedStyle(el).clipPath);
      expect(clip).toContain('inset');
      await expect(page.locator('.cmp__hint')).toContainText('Rê chuột');
    }
  });

  test('Compare slider touch: horizontal drag moves it, vertical swipe scrolls the page', async ({ page, browserName }, info) => {
    test.skip(!isMobile(info.project.name) || browserName !== 'chromium', 'CDP touch (Chromium mobile)');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page, 'astro-island[client="load"]');
    await page.locator('.cmp__frame').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const handle = page.getByRole('slider', { name: /So sánh ảnh gốc/ });
    const before = Number(await handle.getAttribute('aria-valuenow'));
    const box = (await page.locator('.cmp__frame').boundingBox())!;
    await swipe(page, { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 }, { x: box.x + box.width * 0.85, y: box.y + box.height * 0.52 });
    await page.waitForTimeout(300);
    const moved = Number(await handle.getAttribute('aria-valuenow'));
    expect(moved).toBeGreaterThan(before + 15);
    const y0 = await page.evaluate(() => window.scrollY);
    const box2 = (await page.locator('.cmp__frame').boundingBox())!;
    await swipe(page, { x: box2.x + box2.width * 0.4, y: Math.min(box2.y + box2.height * 0.7, 780) }, { x: box2.x + box2.width * 0.42, y: Math.min(box2.y + box2.height * 0.7, 780) - 260 });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 80);
    expect(Math.abs(Number(await handle.getAttribute('aria-valuenow')) - moved)).toBeLessThan(3);
  });

  test('Case studies: four phone mockups, no copy at all, cropped screenshots, labels in the tooltip', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'results');
    await page.waitForTimeout(900);
    // Images only (owner, 2026-10-18): each cell is a React Bits TiltedCard showing the phone screenshot —
    // no card frame, no name/facts/caveat/link (the caveat line was removed at the owner's request too).
    await expect(page.locator('#results .tilted-card')).toHaveCount(4);
    await expect(page.locator('#results .cs__card, #results .cs__note')).toHaveCount(0);
    const text = (await page.locator('#results').textContent()) ?? '';
    // Only the header copy + the 4 tooltips remain in the DOM, so the brand + account size stay reachable.
    for (const s of ['DINH House', 'Kazaki', 'Goodci', 'Lee Chloe Coffee', '12K', '10,4K', '6,3K', '5,9K']) expect(text).toContain(s);
    expect(text).not.toMatch(/\b0\d{2,3}[ .]?\d{3}[ .]?\d{3,4}\b/); // no phone numbers in the copy
    const imgs = await page.locator('#results .tilted-card img').evaluateAll((els) => els.map((i) => ({ ok: (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0, w: (i as HTMLImageElement).naturalWidth, h: (i as HTMLImageElement).naturalHeight })));
    expect(imgs).toHaveLength(4);
    expect(imgs.every((i) => i.ok)).toBe(true);
    // The transparent frame is cropped off, so every card is the same tall phone mockup.
    expect(imgs.every((i) => i.h / i.w > 1.9 && i.h / i.w < 2.2)).toBe(true);
    expect(await page.locator('#results').getByText(/tăng|doanh thu|conversion|ROI/i).count()).toBe(0);
  });

  test('Case studies video cards: platform + views, hover plays in the card, pill opens the original post', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'results');
    const cards = page.locator('#results .cvc');
    await expect(cards).toHaveCount(3);
    // Views sit BELOW the video (CountUp roll, eye icon) with the creator handle under them.
    await expect(page.locator('#results .cvw__views')).toHaveCount(3);
    expect(await page.locator('#results .cvw__views').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual(['378,9K lượt xem', '114K lượt xem', '42,3K lượt xem']);
    await expect(page.locator('#results .cvw__views svg').first()).toBeVisible();
    await expect(page.locator('#results .cvw__creator')).toHaveText(['@decejenni21', '@winnie_wakanda', '@sarayaabdoul.stlaurent']);
    await page.waitForTimeout(2600);
    expect(await page.locator('#results .cvw__num').allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/378\.9K/), expect.stringMatching(/114K/), expect.stringMatching(/42\.3K/)]));
    await expect(page.locator('#results .cvc__chip')).toHaveText(['TikTok', 'Instagram', 'Instagram']);
    const hrefs = await page.locator('#results .cvc__cta').evaluateAll((els) => els.map((a) => [(a as HTMLAnchorElement).href, a.getAttribute('target'), a.getAttribute('rel')]));
    expect(hrefs.map((h) => h[0])).toEqual([
      'https://www.tiktok.com/@decejenni21/video/7653463775470718228',
      'https://www.instagram.com/reel/Da0OLniBkbM/',
      'https://www.instagram.com/reel/Dc7vF90B8Mj/',
    ]);
    expect(hrefs.every((h) => h[1] === '_blank' && /noopener/.test(h[2] ?? ''))).toBe(true);
    await expect(cards.first().locator('video')).toHaveCount(0); // nothing downloads until hover
    await cards.first().hover();
    await expect(cards.first().locator('video')).toHaveCount(1);
    // Playwright's bundled Chromium has no H.264 decoder, so there the clip errors instead of playing — WebKit plays it.
    await page.waitForFunction(() => { const v = document.querySelector('#results .cvc video') as HTMLVideoElement | null; return !!v && ((!v.paused && v.currentTime > 0) || !!v.error || v.networkState === 3); }, undefined, { timeout: 15_000 });
    const decodable = await cards.first().locator('video').evaluate((v) => !(v as HTMLVideoElement).error && (v as HTMLVideoElement).networkState !== 3);
    if (decodable) {
      await cards.first().locator('.cvc__btn').first().click(); // pause button
      expect(await cards.first().locator('video').evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
    }
  });

  test('How I Work: 4 folders; click opens; clicking a paper opens the right lightbox (video + image)', async ({ page }) => {
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'process');
    await page.waitForFunction(() => document.querySelectorAll('#process .folder-root').length === 4, undefined, { timeout: 15_000 });
    expect(mp4).toEqual([]);
    const proc = (await page.locator('#process').textContent()) ?? '';
    expect(proc).not.toContain('Bốn bước từ lắng nghe');
    expect(proc).not.toContain('Bấm thư mục để mở');
    const names = await page.locator('#process .hw__name').allTextContents();
    expect(names.map((n) => n.replace(/\s+/g, ' ').trim())).toEqual(['01Discover', '02Concept', '03Production', '04Delivery']);
    const first = page.locator('#process .folder-root').first();
    const stage = first.locator('.folder-stage');
    await stage.click();
    await page.waitForTimeout(1500);
    await expect(first.locator('.folder-stage')).toHaveAttribute('aria-expanded', 'true');
    // first paper of Discover is the video
    await first.locator('[data-folder-item="0"]').click({ force: true });
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAttribute('data-variant', 'video');
    await expect.poll(() => mp4.length).toBeGreaterThan(0);
    expect(mp4.every((u) => /how-i-work-v01-720\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);
    await expect(page.locator('#dfl-slot-counter')).toHaveText('1 / 3');
    await page.locator('.lb-nav--next').click();
    await expect(dialog(page)).toHaveAttribute('data-variant', 'image');
    await expect(page.locator('#dfl-image')).toHaveAttribute('src', /how-i-work-i06-full\.[0-9a-f]{8}\.webp/);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('About: Reflective Card never touches the camera; static card is complete without it', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __media: string[] }).__media = [];
      const md = navigator.mediaDevices;
      if (md) {
        const orig = md.getUserMedia?.bind(md);
        md.getUserMedia = (c) => {
          (window as unknown as { __media: string[] }).__media.push('getUserMedia');
          return orig ? orig(c) : Promise.reject(new Error('none'));
        };
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'about');
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as unknown as { __media: string[] }).__media)).toEqual([]);
    await expect(page.locator('#about .fc__name')).toHaveText('Thành Nguyễn');
    await expect(page.locator('#about .fc__role')).toHaveText('Founder & Creative Lead');
    const text = (await page.locator('#about').textContent()) ?? '';
    expect(text).not.toMatch(/\d+\s*(năm|years)/i); // no invented experience claims
  });

  test('no console errors, no mp4 before a click, across the whole long page', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 450) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(800);
    expect(mp4).toEqual([]);
    expect(errors).toEqual([]);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(o.sw).toBeLessThanOrEqual(o.cw);
  });
});
