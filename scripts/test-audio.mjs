import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:4199', { waitUntil: 'load' });
await page.waitForTimeout(4000);

// Click anywhere on page
await page.mouse.click(640, 400);
await page.waitForTimeout(1000);

const audioLink = await page.$('a[aria-label="Toggle Audio"]');
console.log('Audio toggle link found:', !!audioLink);
if (audioLink) {
  await audioLink.click();
} else {
  await page.evaluate(() => AppState.set('Global/audioEnabled', true));
}
await page.waitForTimeout(2000);

const status = await page.evaluate(() => {
  return {
    audioEnabled: AppState.get('Global/audioEnabled'),
    activeSounds: SFXController?.instance?.() ? Object.keys(SFXController.instance().activeSounds || {}) : [],
    sounds: SFXController?.instance?.() ? Object.keys(SFXController.instance().sounds || {}) : []
  };
});
console.log('Audio status:', status);
await browser.close();

