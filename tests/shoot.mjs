// Phase-1 review screenshots: node tests/shoot.mjs [baseURL]
// Writes docs/screenshots/{desktop,mobile}-NN-*.png at 1440×900 and 390×844.
import { chromium } from '@playwright/test';
const base = process.argv[2] || 'http://localhost:4322';
const out = 'docs/screenshots';
const browser = await chromium.launch();
const wait = (p, ms) => p.waitForTimeout(ms);
const to = (p, id) => p.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), id);

for (const vp of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, mobile: true },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.mobile ? 2 : 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `${out}/${vp.name}-${n}.png` });
  await page.goto(base, { waitUntil: 'networkidle' });
  await wait(page, 5500); // let the Lanyard intro swing settle
  await shot('01-hero');

  await to(page, 'work');
  await wait(page, 1600);
  await shot('02-video-gallery');
  if (!vp.mobile) {
    const bb = await page.locator('#work .vcard').nth(1).boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await wait(page, 2500);
    await shot('02b-video-gallery-hover-preview');
    await page.mouse.move(5, 5);
  }

  await to(page, 'social');
  await wait(page, 1800);
  if (vp.mobile) await page.evaluate(() => document.querySelector('.srail').scrollIntoView({ behavior: 'instant', block: 'start' }));
  await wait(page, 300);
  await shot('03-social-start');

  if (vp.mobile) {
    // touch devices have no rail arrows: swipe equivalent
    await page.evaluate(() => { const r = document.querySelector('.srail__track'); r.scrollLeft += r.querySelector('.sb').offsetWidth * 2; });
  } else {
    const railNext = page.getByRole('button', { name: 'Thương hiệu sau' });
    for (let i = 0; i < 4; i++) {
      await railNext.click();
      await wait(page, 750);
    }
  }
  await wait(page, 500);
  await shot('04-social-scrolled');

  // Video lightbox — portrait (gallery)
  await to(page, 'work');
  await wait(page, 600);
  await page.locator('.vcard').first().click();
  await wait(page, 2500);
  await page.evaluate(() => document.getElementById('dfl-video').pause());
  await wait(page, 300);
  await shot('06-lightbox-portrait');
  await page.keyboard.press('Escape');
  await wait(page, 300);

  // Social: video playing IN PLACE (Kazaki landscape video), no lightbox
  await to(page, 'social');
  await wait(page, 600);
  { const box = await page.locator('.srail__track').boundingBox(); await page.mouse.move(box.x + 4, box.y + 4); }
  await wait(page, 600);
  if (!vp.mobile) {
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Bài sau của Kazaki' }).click();
      await wait(page, 300);
    }
    await wait(page, 2800);
    await shot('07-social-video-in-place');
    await page.mouse.move(5, 5);
  }

  // Quick Call — step 1, step 4 validation, demo result
  await page.locator('.hero__ctas [data-dfl-open="quickcall"]').click();
  await wait(page, 1200);
  await page.getByRole('radio', { name: 'F&B / Restaurant' }).click();
  await wait(page, 200);
  await shot('08-quickcall-step1');
  const next = page.locator('#dfl-dialog .stepper__button--next');
  await next.click();
  await wait(page, 600);
  await page.getByRole('checkbox', { name: 'Video Editing' }).click();
  await next.click();
  await wait(page, 600);
  await page.getByRole('radio', { name: 'Tự làm' }).click();
  await next.click();
  await wait(page, 700);
  await page.getByLabel('Tên của bạn').fill('Lan Anh');
  const phone = page.getByLabel('Zalo / Phone', { exact: true });
  await phone.fill('0901');
  await phone.blur();
  await wait(page, 300);
  await shot('09-quickcall-step4-validation');
  await phone.fill('0901234567');
  await next.click();
  await wait(page, 600);
  await shot('10-quickcall-demo-result');
  await page.keyboard.press('Escape');
  await wait(page, 300);

  // ---- Phase 2 sections ----
  const at = async (id, dy = 0, ms = 2200) => {
    await page.evaluate(([id, dy]) => {
      document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, dy);
    }, [id, dy]);
    await wait(page, ms);
  };
  await at('trusted', -120);
  await shot('11-trusted-by');
  await at('behind', vp.mobile ? 0 : 120);
  await shot('12-behind-raw-final');
  await page.locator('.cmp__frame').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -100));
  await wait(page, 2200);
  await shot('13-behind-ai-compare');
  await at('results', vp.mobile ? 0 : 140);
  await shot('14-case-studies');
  await at('process', vp.mobile ? 0 : 140);
  await wait(page, 600);
  await shot('15-how-i-work-closed');
  await page.locator('#process .folder-stage').first().click();
  await wait(page, 1800);
  await shot('16-how-i-work-open');
  await at('about', vp.mobile ? 0 : 60);
  await shot('17-about-founder');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await wait(page, 800);
  await shot('18-footer');
  await ctx.close();
}
await browser.close();
console.log('screenshots written to', out);
