import { test, expect } from '@playwright/test';
import { cardExpand, cardLeft, dialog, fullyVisibleBrands, mostlyVisibleBrands, openCardLightbox, pauseRail, scrollToId, swipe, trackConsoleErrors, trackMp4, waitHydrated, waitRail } from './helpers';

const isMobile = (name: string) => name.startsWith('mobile');

test.describe('page load & network @webkit', () => {
  test('no .mp4 on load or scroll; hover requests only the small preview clips; no console errors', async ({ page }, info) => {
    const mp4 = trackMp4(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    expect(mp4, 'mp4 requests before any hover/click').toEqual([]);
    expect(await page.locator('main video[src]').count(), 'no <video> with a source inside page content').toBe(0);
    if (!isMobile(info.project.name)) {
      await scrollToId(page, 'work');
      for (const card of await page.locator('#work .vcard').all()) {
        await card.hover();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);
      expect(mp4.length).toBeGreaterThan(0);
      expect(mp4.every((u) => /-preview\.[0-9a-f]{8}\.mp4/.test(u)), 'hover loads preview clips only: ' + mp4.join(', ')).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('sections: no divider lines, tight vertical rhythm', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const info = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => ({ id: e.id, border: getComputedStyle(e).borderTopWidth, pad: parseFloat(getComputedStyle(e).paddingTop) })));
    for (const s of info) {
      expect(s.border, `${s.id} has a divider line`).toBe('0px');
      if (s.id !== 'top') expect(s.pad, `${s.id} padding`).toBeLessThanOrEqual(64);
    }
    expect(await page.locator('footer').evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px');
  });

  test('Video Editing: no play button; hover previews in place; click still opens the lightbox and stops the preview', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await scrollToId(page, 'work');
    expect(await page.locator('#work .vcard__play').count()).toBe(0);
    expect(await page.locator('#work svg path[d^="M8 5.5"]').count()).toBe(0);
    if (isMobile(info.project.name)) return;
    const mp4 = trackMp4(page);
    await page.mouse.click(5, 300); // any user gesture lets the browser allow sound
    const card = page.locator('#work .vcard').nth(1);
    await card.hover();
    const v = page.locator('#work video.vcard__preview');
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > 0.2), { timeout: 15_000 }).toBe(true);
    await expect(card).toHaveAttribute('data-previewing', '');
    expect(await v.evaluate((el: HTMLVideoElement) => ({ muted: el.muted, loop: el.loop, volume: el.volume }))).toMatchObject({ muted: false, loop: true, volume: 0.5 });
    expect(mp4.every((u) => /gallery-v02-preview\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);
    // leaving stops and detaches the preview
    await page.mouse.move(5, 5);
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => ({ src: el.getAttribute('src'), paused: el.paused }))).toEqual({ src: null, paused: true });
    // click → lightbox with sound-capable full video; preview is stopped
    await card.click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAttribute('data-variant', 'video');
    expect(await v.evaluate((el: HTMLVideoElement) => el.getAttribute('src'))).toBeNull();
    await page.keyboard.press('Escape');
  });

  test('Volume (touch): tap plays the preview with sound, a second tap opens the gauge, the level follows the videos below', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'touch-only: hover devices keep the lightbox on a card click');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await scrollToId(page, 'work');
    const cards = page.locator('#work .vcard');
    const v = page.locator('#work video.vcard__preview');
    const gauge = page.locator('#work .vol');

    // Tap: the preview plays in place with sound — the lightbox never opens from the card itself.
    await cards.nth(0).tap();
    await expect(cards.nth(0)).toHaveAttribute('data-previewing', '');
    await expect(dialog(page)).toBeHidden();
    expect(await v.first().evaluate((el: HTMLVideoElement) => ({ muted: el.muted, volume: el.volume }))).toMatchObject({ muted: false, volume: 0.5 });

    // Second tap: the gauge opens over the still-running video (blurred backdrop).
    await cards.nth(0).tap();
    await expect(gauge).toBeVisible();
    await expect(gauge.locator('.slosh-gauge')).toBeVisible();
    await expect(cards.nth(0)).toHaveAttribute('data-volume-open', '');
    expect(await v.first().evaluate((el: HTMLVideoElement) => el.paused)).toBe(false);

    // Drag the tank down: the level is written to the session store and follows the running video.
    const tank = (await gauge.locator('.slosh-gauge').boundingBox())!;
    const cx = tank.x + tank.width / 2;
    await page.mouse.move(cx, tank.y + tank.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(cx, tank.y + tank.height * 0.85, { steps: 8 });
    await page.mouse.up();
    const level = await v.first().evaluate((el: HTMLVideoElement) => el.volume);
    expect(level).toBeGreaterThan(0.1);
    expect(level).toBeLessThan(0.5);

    // Tap outside the tank closes the gauge; the card keeps its preview.
    const media = (await cards.nth(0).locator('.vcard__media').boundingBox())!;
    await page.touchscreen.tap(media.x + 12, media.y + 16);
    await expect(gauge).toBeHidden();
    await expect(cards.nth(0)).not.toHaveAttribute('data-volume-open', '');

    // The level is the session level: the next video starts at the same one.
    await cards.nth(1).tap();
    await expect.poll(() => page.locator('#work video.vcard__preview[src]').evaluate((el: HTMLVideoElement) => el.volume)).toBeCloseTo(level, 2);

    // On touch the ⤢ button is the way into the lightbox; opening it ends the in-place preview.
    await page.locator('#work .vcard__expand').first().click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAttribute('data-variant', 'video');
    await expect(cards.nth(1)).not.toHaveAttribute('data-previewing', '');
    expect(await page.locator('#dfl-video').evaluate((el: HTMLVideoElement) => el.volume)).toBeCloseTo(level, 2);
    await page.keyboard.press('Escape');
  });

  test('no horizontal page overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(o.sw).toBeLessThanOrEqual(o.cw);
  });

  test('nav links point to sections that exist and have content', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('.hdr__links a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs).toEqual(['#work', '#social', '#results', '#about']);
    for (const h of hrefs) {
      const text = (await page.locator(h).textContent()) ?? '';
      expect(text.trim().length, h).toBeGreaterThan(40);
    }
  });
});

test.describe('floating nav + frame @webkit', () => {
  test('pill nav highlights the section in view; frame never blocks input', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const frame = page.locator('.site-frame');
    expect(await frame.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    if (!isMobile(info.project.name)) {
      await expect(frame).toBeVisible();
      await expect(page.locator('.hdr__links a[aria-current]')).toHaveCount(0);
      await scrollToId(page, 'social');
      await expect(page.locator('.hdr__links a[aria-current]')).toHaveText('Services');
      const ind = await page.locator('[data-indicator]').evaluate((el) => ({ o: getComputedStyle(el).opacity, w: el.getBoundingClientRect().width }));
      expect(Number(ind.o)).toBe(1);
      expect(ind.w).toBeGreaterThan(40);
      // pill is centred and fixed
      const box = await page.locator('.hdr__pill').boundingBox();
      expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(2);
    } else {
      await expect(frame).toBeHidden();
    }
  });
});

test.describe('first click works before hydration @webkit', () => {
  test("Let's Talk opens the dialog immediately while JS is still loading, then React takes over the same dialog", async ({ page }, info) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const trigger = isMobile(info.project.name) ? page.locator('.hero__ctas [data-dfl-open="quickcall"]') : page.locator('.hdr__cta');
    const t0 = Date.now();
    await trigger.click();
    await expect(dialog(page)).toBeVisible();
    expect(Date.now() - t0, "dialog must open without waiting for the (blocked) JS").toBeLessThan(4000);
    await expect(dialog(page)).toHaveAttribute('data-variant', 'quickcall');
    expect(await page.locator('[role="dialog"]').count()).toBe(1);

    release();
    await expect(page.locator('#dfl-dialog .qc-q').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#dfl-dialog .dlg__loading')).toBeHidden();
    expect(await page.locator('[role="dialog"]').count(), 'still exactly one dialog').toBe(1);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('video poster opens and starts the right mp4 before hydration', async ({ page }, info) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await scrollToId(page, 'work');
    await openCardLightbox(page.locator('.vcard').first(), isMobile(info.project.name));
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAttribute('data-variant', 'video');
    await expect.poll(() => mp4.length).toBeGreaterThan(0);
    expect(mp4.some((u) => /gallery-v01-720\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);
    expect(mp4.filter((u) => /-720\.[0-9a-f]{8}\.mp4/.test(u) && !/gallery-v01-720\.[0-9a-f]{8}\.mp4/.test(u))).toEqual([]); // never another full video
    release();
    await expect(page.locator('#dfl-dialog .lb-controls')).toBeVisible({ timeout: 15_000 });
    await page.locator('#dfl-dialog .dlg__close').click();
    await expect(dialog(page)).toBeHidden();
  });

  test('dialog still closes (Esc / ×) and shows a fallback when React never loads', async ({ page }) => {
    await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const btn = page.locator('.hero__ctas [data-dfl-open="quickcall"]');
    await btn.click();
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('[data-dfl-error]')).toBeVisible({ timeout: 12_000 });
    await expect(page.locator('[data-dfl-error] a[href^="mailto:"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(btn).toBeFocused();
    // × button path
    await btn.click();
    await page.locator('#dfl-dialog .dlg__close').click();
    await expect(dialog(page)).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('video lightbox @webkit', () => {
  test('controls, next/prev, close cleanup and focus restore', async ({ page }, info) => {
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await scrollToId(page, 'work');
    const first = page.locator('.vcard').first();
    await openCardLightbox(first, isMobile(info.project.name));
    const shell = dialog(page);
    await expect(shell).toBeVisible();
    await expect(page.locator('.lb-controls')).toBeVisible();
    await expect(page.locator('#dfl-slot-counter')).toHaveText('1 / 4');
    await expect.poll(() => mp4.some((u) => /gallery-v01-720\.[0-9a-f]{8}\.mp4/.test(u))).toBe(true);

    const video = page.locator('#dfl-video');
    // Make sure we are playing (muted fallback is acceptable in headless).
    await expect.poll(async () => video.evaluate((v: HTMLVideoElement) => !v.paused), { timeout: 10_000 }).toBe(true);
    // pause / play
    await page.locator('.lb-controls .lb-btn').first().click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await page.locator('.lb-controls .lb-btn').first().click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
    // seek to 50%
    await video.evaluate((v: HTMLVideoElement) => new Promise((r) => (v.duration ? r(null) : v.addEventListener('loadedmetadata', () => r(null), { once: true }))));
    await page.locator('.lb-seek').fill('500');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime / v.duration)).toBeGreaterThan(0.4);
    await expect(page.locator('.lb-time')).toContainText(' / 0:30');
    // mute toggle
    const muteBtn = page.locator('.lb-controls .lb-btn').nth(1);
    const before = await video.evaluate((v: HTMLVideoElement) => v.muted);
    await muteBtn.click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(!before);
    // next / prev
    await page.locator('.lb-nav--next').click();
    await expect(page.locator('#dfl-slot-counter')).toHaveText('2 / 4');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc)).toMatch(/gallery-v02-720\.[0-9a-f]{8}\.mp4/);
    await page.locator('.lb-nav--prev').click();
    await expect(page.locator('#dfl-slot-counter')).toHaveText('1 / 4');
    await expect(page.locator('.lb-nav--prev')).toBeDisabled();
    // close → no source, paused, focus back on the card
    await page.keyboard.press('Escape');
    await expect(shell).toBeHidden();
    expect(await video.evaluate((v: HTMLVideoElement) => ({ src: v.getAttribute('src'), paused: v.paused }))).toEqual({ src: null, paused: true });
    // focus returns to whatever opened the lightbox: the card on hover devices, its ⤢ button on touch.
    await expect(isMobile(info.project.name) ? cardExpand(first) : first).toBeFocused();
  });

  test('focus is trapped inside the dialog', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'keyboard test on desktop');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await page.locator('.hdr__cta').focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => !!document.activeElement?.closest('#dfl-dialog'));
      expect(inside).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('.hdr__cta')).toBeFocused();
  });
});

test.describe('social production rail', () => {
  test('one row, no frames; first view shows DinhHouse/Lee Chloe/Kazaki; arrows loop through every brand forever', async ({ page }, info) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.waitForTimeout(1200); // fade-in
    await pauseRail(page);
    const names = await page.locator('.sb__name').allInnerTexts();
    expect(names).toEqual(['DinhHouse', 'Lee Chloe', 'Kazaki', 'Goodci', 'Winnie', 'Marie', 'Porche']);
    // frameless: no border / background / radius on a brand group
    const frame = await page.locator('.sb').first().evaluate((el) => { const c = getComputedStyle(el); return { b: c.borderTopWidth, bg: c.backgroundColor, r: c.borderTopLeftRadius }; });
    expect(frame).toEqual({ b: '0px', bg: 'rgba(0, 0, 0, 0)', r: '0px' });
    const tops = await page.locator('.sb').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
    expect(tops, 'all brands on one row').toBe(1);
    const seen = new Set<string>();
    const first = await mostlyVisibleBrands(page);
    if (!isMobile(info.project.name)) expect(first.slice(0, 3)).toEqual(['dinhhouse', 'leechloe', 'kazaki']);
    else expect(first[0]).toBe('dinhhouse');
    // carousels are larger than before
    const cw = await page.locator('.sb[data-brand="dinhhouse"] .depth-carousel__card').first().evaluate((el) => el.getBoundingClientRect().width);
    expect(cw).toBeGreaterThan(isMobile(info.project.name) ? 190 : 270);
    for (const b of await fullyVisibleBrands(page)) seen.add(b);
    for (const b of first) seen.add(b);
    if (isMobile(info.project.name)) return; // rail arrows are hidden on touch devices (swipe instead)
    const next = page.getByRole('button', { name: 'Thương hiệu sau' });
    for (let i = 0; i < 16; i++) {
      await next.click();
      await page.waitForTimeout(650);
      await pauseRail(page);
      for (const b of await mostlyVisibleBrands(page)) seen.add(b);
    }
    expect([...seen].sort()).toEqual(['dinhhouse', 'goodci', 'kazaki', 'leechloe', 'marie', 'porche', 'winnie']);
    expect(await page.locator('.srail__hint, .sb__meta, .sb-slide-action, .sb-slide-tag').count(), 'no hint pill, counts, action buttons or tags').toBe(0);
    expect(await page.locator('#social .section-lead').count()).toBe(0);
    expect(await page.locator('#social [data-dfl-open]').count(), 'Social items do not open a lightbox').toBe(0);
    // 16 clicks = 2+ full laps: the loop never ends (dinhhouse is back in view and every brand still exists once)
    expect(await page.locator('.sb').count()).toBe(7);
    await expect(page.locator('.sb .depth-carousel')).toHaveCount(7);
    const prev = page.getByRole('button', { name: 'Thương hiệu trước' });
    const before = await cardLeft(page, 'dinhhouse');
    await prev.click();
    await page.waitForTimeout(700);
    expect(await cardLeft(page, 'dinhhouse')).toBeGreaterThan(before - 5 > 0 ? before : -100000);
  });

  test('drifts right→left on its own, pauses while hovered, resumes on leave; fades in', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'drift is for hover-capable devices');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.mouse.move(2, 2);
    await scrollToId(page, 'social');
    await waitRail(page);
    await expect(page.locator('.srail')).toHaveAttribute('data-intro', /pre|in/);
    await page.mouse.move(2, 2);
    const x0 = await cardLeft(page, 'dinhhouse');
    await page.waitForTimeout(3500); // generous: CI machines can run rAF far below 60 fps
    const x1 = await cardLeft(page, 'dinhhouse');
    expect(x1, 'moves left').toBeLessThan(x0 - 15);
    expect(x0 - x1, 'slowly').toBeLessThan(300);
    // hover pauses
    await pauseRail(page);
    await page.waitForTimeout(300);
    const h0 = await cardLeft(page, 'dinhhouse');
    await page.waitForTimeout(1800);
    expect(Math.abs((await cardLeft(page, 'dinhhouse')) - h0)).toBeLessThanOrEqual(1);
    // leaving resumes
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
    const r0 = await cardLeft(page, 'dinhhouse');
    await page.waitForTimeout(1800);
    expect(await cardLeft(page, 'dinhhouse')).toBeLessThan(r0 - 20);
    // entry fade was applied
    expect(await page.locator('.sb').first().evaluate((el) => getComputedStyle(el).animationName)).toMatch(/sb-in|none/);
  });

  test('the loop wraps without a visual jump (a card leaving on the left re-enters on the right)', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'desktop drift');
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await pauseRail(page);
    const before = await cardLeft(page, 'dinhhouse');
    const orderBefore = await page.locator('.sb[data-brand="dinhhouse"]').evaluate((el) => el.style.order);
    const next = page.getByRole('button', { name: 'Thương hiệu sau' });
    for (let i = 0; i < 3; i++) {
      await next.click();
      await page.waitForTimeout(700);
    }
    await pauseRail(page);
    // after 3 steps DinhHouse has passed the left edge and was moved to the end of the order
    expect(await page.locator('.sb[data-brand="dinhhouse"]').evaluate((el) => Number(el.style.order))).toBeGreaterThan(Number(orderBefore));
    // positions stayed continuous: no card ever sat more than one step away from its expected spot
    const step = await page.evaluate(() => { const c = document.querySelectorAll('.sb'); return c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left; });
    expect(Math.abs(step)).toBeGreaterThan(300);
  });

  test('inner drag moves only the carousel; header drag moves only the rail; no lightbox after drag', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'mouse drag on desktop; touch covered below');
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.waitForTimeout(1200);
    const lee = page.locator('.sb[data-brand="leechloe"]');
    const counter = lee.locator('.sb__counter');
    await expect(counter).toContainText('1 / 15');
    await pauseRail(page);
    const stage = await lee.locator('.depth-carousel').boundingBox();
    const sx = stage!.x + stage!.width / 2;
    const sy = stage!.y + stage!.height / 2;
    const left0 = await cardLeft(page, 'leechloe');
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(sx - i * 22, sy + 2);
    await page.mouse.up();
    await page.waitForTimeout(800);
    expect(Math.abs((await cardLeft(page, 'leechloe')) - left0), 'rail did not move').toBeLessThanOrEqual(2);
    await expect(counter).not.toContainText('1 / 15');
    await expect(dialog(page)).toBeHidden();

    // header drag → rail moves, carousel index unchanged
    const before = (await counter.textContent())!.replace(/\s+/g, ' ').trim();
    const head = await page.locator('.sb[data-brand="kazaki"] .sb__head').boundingBox();
    await page.mouse.move(head!.x + 40, head!.y + 20);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(head!.x + 40 - i * 30, head!.y + 22);
    await page.mouse.up();
    await page.waitForTimeout(600);
    expect(left0 - (await cardLeft(page, 'leechloe'))).toBeGreaterThan(150);
    expect((await counter.textContent())!.replace(/\s+/g, ' ').trim()).toBe(before);
    await expect(dialog(page)).toBeHidden();
  });

  test('vertical wheel over a carousel scrolls the page; horizontal wheel changes the slide', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'wheel is a desktop input');
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.waitForTimeout(1200);
    const box = await page.locator('.sb[data-brand="dinhhouse"] .depth-carousel').boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 100);
    await scrollToId(page, 'social');
    await page.waitForTimeout(600);
    const b2 = await page.locator('.sb[data-brand="dinhhouse"] .depth-carousel').boundingBox();
    const left0 = await cardLeft(page, 'dinhhouse');
    await page.mouse.move(b2!.x + b2!.width / 2, b2!.y + b2!.height / 2);
    await page.mouse.wheel(260, 0);
    await page.waitForTimeout(700);
    await expect(page.locator('.sb[data-brand="dinhhouse"] .sb__counter')).not.toContainText('1 / 9');
    expect(Math.abs((await cardLeft(page, 'dinhhouse')) - left0)).toBeLessThanOrEqual(2);
  });

  test('tap neighbour → brings it forward; tapping the front image does NOT zoom/open anything', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.waitForTimeout(1200);
    await pauseRail(page);
    const dh = page.locator('.sb[data-brand="dinhhouse"]');
    const cards = dh.locator('.depth-carousel__card');
    const front = await cards.nth(0).boundingBox();
    const nb = await cards.nth(1).boundingBox();
    await page.mouse.click((front!.x + front!.width + nb!.x + nb!.width) / 2, nb!.y + nb!.height / 2);
    await expect(dh.locator('.sb__counter')).toContainText('2 / 9');
    await page.waitForTimeout(1000); // let the slide animation finish before measuring
    const f2 = await dh.locator('.depth-carousel__card[data-active]').boundingBox();
    await page.mouse.click(f2!.x + f2!.width / 2, f2!.y + f2!.height / 2);
    await page.waitForTimeout(500);
    await expect(dialog(page)).toBeHidden();
    await expect(dh.locator('.sb__counter')).toContainText('2 / 9'); // still the same slide
  });

  test('video slides play IN PLACE: auto, loop, 50% volume on hover (muted otherwise), tap pauses; landscape not cropped', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'hover/sound behaviour is for hover-capable devices');
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.waitForTimeout(1200);
    await page.mouse.click(5, 300); // user gesture → sound allowed
    await pauseRail(page);
    const kz = page.locator('.sb[data-brand="kazaki"]');
    // interleaved order: i01, v01, i02, v02 (kazaki2.mp4, landscape) → 3 arrow clicks
    for (let i = 0; i < 3; i++) {
      await kz.getByRole('button', { name: 'Bài sau của Kazaki' }).click();
      await page.waitForTimeout(300);
    }
    await expect(kz.locator('.sb__counter')).toContainText('4 / 11');
    const v = kz.locator('video.sb-video');
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > 0.3), { timeout: 20_000 }).toBe(true);
    expect(await v.evaluate((el: HTMLVideoElement) => el.currentSrc)).toMatch(/social-kazaki-v02-720\.[0-9a-f]{8}\.mp4/);
    expect(await v.evaluate((el: HTMLVideoElement) => ({ vol: el.volume, muted: el.muted, loop: el.loop, fit: getComputedStyle(el).objectFit }))).toEqual({ vol: 0.5, muted: false, loop: true, fit: 'contain' });
    await expect(dialog(page)).toBeHidden();
    // leaving the group mutes it (it keeps playing)
    await page.mouse.move(5, 5);
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.muted)).toBe(true);
    expect(await v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false);
    // back on the group: 50% again; tap on the front slide pauses, tap again resumes
    await pauseRail(page);
    await kz.hover();
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.muted)).toBe(false);
    const f = await kz.locator('.depth-carousel__card[data-active]').boundingBox();
    await page.mouse.click(f!.x + f!.width / 2, f!.y + f!.height / 2);
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
    await page.mouse.click(f!.x + f!.width / 2, f!.y + f!.height / 2);
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false);
    // moving to another slide detaches the video (no background downloads)
    await kz.getByRole('button', { name: 'Bài sau của Kazaki' }).click();
    await expect.poll(() => kz.locator('video.sb-video').count()).toBe(0);
  });

  test('every Social video is encoded now (no "Chưa sẵn sàng" badge in the carousels)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    expect(await page.locator('.sb .badge-pending').count()).toBe(0);
    expect(await page.locator('.sb [data-video-pending]').count()).toBe(0);
  });

  test('"not ready" video state (kept for future assets): clear message, no play controls, no mp4 request', async ({ page }) => {
    const mp4 = trackMp4(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'inject-pending';
      b.dataset.dflOpen = 'video';
      b.dataset.mediaId = 'future-video';
      b.dataset.group = 'none';
      b.dataset.title = 'Video chưa xử lý';
      b.dataset.poster = document.querySelector('#work img')!.getAttribute('src')!;
      b.dataset.aspect = '0.5625';
      b.setAttribute('data-video-pending', '');
      b.textContent = 'x';
      document.querySelector('main')!.appendChild(b);
    });
    await page.locator('#inject-pending').dispatchEvent('click');
    await expect(dialog(page)).toHaveAttribute('data-pending', '');
    await expect(page.locator('.dlg__pending')).toBeVisible();
    await expect(page.locator('.dlg__pending .badge-pending')).toHaveText('Chưa sẵn sàng');
    await expect(page.locator('.lb-controls')).toHaveCount(0);
    expect(mp4).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });
});

test.describe('mobile touch gestures', () => {
  test('swipe on images changes the slide only; swipe on header scrolls the rail; vertical swipe scrolls the page', async ({ page, browserName }, info) => {
    test.skip(!isMobile(info.project.name) || browserName !== 'chromium', 'CDP touch emulation (Chromium mobile)');
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollToId(page, 'social');
    await waitRail(page);
    await page.evaluate(() => window.scrollBy(0, 200));
    const dh = page.locator('.sb[data-brand="dinhhouse"]');
    const st = await dh.locator('.depth-carousel').boundingBox();
    const cx = st!.x + st!.width / 2;
    const cy = st!.y + st!.height / 2;
    const left0 = await cardLeft(page, 'dinhhouse');

    await swipe(page, { x: cx + 80, y: cy }, { x: cx - 100, y: cy + 4 });
    await page.waitForTimeout(800);
    await expect(dh.locator('.sb__counter')).not.toContainText('1 / 9');
    expect(Math.abs((await cardLeft(page, 'dinhhouse')) - left0), 'rail did not move').toBeLessThanOrEqual(2);
    await expect(dialog(page)).toBeHidden();

    const y0 = await page.evaluate(() => window.scrollY);
    await swipe(page, { x: cx, y: cy + 60 }, { x: cx + 4, y: cy - 220 });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 80);

    await scrollToId(page, 'social');
    await page.waitForTimeout(600);
    const head = await dh.locator('.sb__head').boundingBox();
    await swipe(page, { x: head!.x + head!.width - 20, y: head!.y + head!.height / 2 }, { x: head!.x + 10, y: head!.y + head!.height / 2 + 2 });
    await page.waitForTimeout(900);
    await page.waitForTimeout(500);
    expect(left0 - (await cardLeft(page, 'dinhhouse')), 'header swipe moved the rail').toBeGreaterThan(100);
  });
});

test.describe('quick call stepper', () => {
  test('4 steps, buttons, validation, state kept on back, honest demo submit', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await page.locator('.hero__ctas [data-dfl-open="quickcall"]').click();
    const d = dialog(page);
    await expect(d.locator('.qc__demo')).toContainText('Form demo — chưa nhận lead thật', { timeout: 20_000 });
    const next = d.locator('.stepper__button--next');
    await expect(next).toBeDisabled();
    await d.getByRole('radio', { name: 'F&B / Restaurant' }).click();
    await expect(next).toBeEnabled();
    await next.click();
    // step 2 multi-select
    await expect(d.locator('.qc-q').last()).toHaveText('Bạn đang cần hỗ trợ gì nhất?');
    await expect(next).toBeDisabled();
    await d.getByRole('checkbox', { name: 'Video Editing' }).click();
    await d.getByRole('checkbox', { name: 'Social Content' }).click();
    await expect(d.getByRole('checkbox', { checked: true })).toHaveCount(2);
    await next.click();
    // back keeps state
    await d.locator('.stepper__button--back').click();
    await expect(d.getByRole('checkbox', { checked: true })).toHaveCount(2);
    await next.click();
    await d.getByRole('radio', { name: 'Tự làm' }).click();
    await next.click();
    // step 4 validation
    await expect(next).toBeDisabled();
    const name = d.getByLabel('Tên của bạn');
    await name.fill('A');
    await name.blur();
    await expect(d.locator('.qc-err')).toHaveText('Vui lòng nhập tên.');
    await name.fill('Lan Anh');
    await d.getByRole('radio', { name: 'Email' }).click();
    const val = d.getByLabel('Email', { exact: true });
    await val.fill('khong-hop-le');
    await val.blur();
    await expect(d.locator('.qc-err')).toHaveText('Email chưa hợp lệ.');
    await expect(next).toBeDisabled();
    await val.fill('lan.anh@example.com');
    await expect(next).toBeDisabled(); // consent still missing
    await d.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(d.locator('.qc-result--demo')).toContainText('CHƯA được gửi đi');
    await expect(d.locator('.qc-result--ok')).toHaveCount(0);
  });
});

test.describe('keyboard & reduced motion', () => {
  test('mobile menu: open, Escape closes and returns focus', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'mobile header');
    await page.goto('/');
    await waitHydrated(page);
    const burger = page.locator('.hdr__burger');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.hdr__links a').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(burger).toBeFocused();
    await burger.click();
    await page.locator('.hdr__links a[href="#social"]').click();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('reduced motion: content visible without animation, no Lanyard, everything still works', async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await scrollToId(page, 'work');
    await page.waitForTimeout(200);
    const op = await page.locator('.vcard').first().evaluate((el) => {
      let n: HTMLElement | null = el as HTMLElement;
      let o = 1;
      while (n) { o *= Number(getComputedStyle(n).opacity); n = n.parentElement; }
      return o;
    });
    expect(op).toBe(1);
    expect(await page.locator('.lanyard-canvas').count()).toBe(0);
    await expect(page.locator('.hl__static img')).toBeVisible();
    await openCardLightbox(page.locator('.vcard').first(), isMobile(info.project.name));
    await expect(page.locator('.lb-controls')).toBeVisible();
    await page.keyboard.press('Escape');
    if (!isMobile(info.project.name)) {
      await scrollToId(page, 'social');
      await waitRail(page);
      await page.getByRole('button', { name: 'Bài sau của DinhHouse' }).click();
      await expect(page.locator('.sb[data-brand="dinhhouse"] .sb__counter')).toContainText('2 / 9');
    }
  });

  test('hero CTAs stay clickable over the Dot Grid / Lanyard', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'desktop pointer');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitHydrated(page);
    await page.mouse.move(300, 500);
    await page.mouse.move(700, 450, { steps: 10 });
    const hit = await page.evaluate(() => {
      const b = document.querySelector('.hero__ctas a[href="#work"]')!.getBoundingClientRect();
      return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)?.closest('.hbtn')?.textContent;
    });
    expect(hit).toContain('Explore My Work');
    // Lanyard column must not overlap the text column
    const overlap = await page.evaluate(() => {
      const a = document.querySelector('.hero__copy')!.getBoundingClientRect();
      const b = document.querySelector('.hero__visual')!.getBoundingClientRect();
      return a.right > b.left + 1;
    });
    expect(overlap).toBe(false);
    await page.locator('.hero__ctas a[href="#work"]').click();
    await expect.poll(() => page.evaluate(() => document.getElementById('work')!.getBoundingClientRect().top)).toBeLessThan(120);
  });
});
