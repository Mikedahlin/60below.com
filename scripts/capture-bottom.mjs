import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:4199', { waitUntil: 'load' });
await page.waitForTimeout(4000);

const scrollInfo = await page.evaluate(() => {
  const fx = document.querySelector('.FXScroll');
  return {
    scrollHeight: fx.scrollHeight,
    clientHeight: fx.clientHeight
  };
});
console.log('Scroll info:', scrollInfo);

const steps = [
  { name: 'step-070', top: scrollInfo.scrollHeight * 0.70 },
  { name: 'step-075', top: scrollInfo.scrollHeight * 0.75 },
  { name: 'step-080', top: scrollInfo.scrollHeight * 0.80 },
  { name: 'step-085', top: scrollInfo.scrollHeight * 0.85 },
  { name: 'step-090', top: scrollInfo.scrollHeight * 0.90 },
  { name: 'step-095', top: scrollInfo.scrollHeight * 0.95 },
  { name: 'step-100', top: scrollInfo.scrollHeight }
];

for (const s of steps) {
  await page.evaluate((top) => {
    const fx = document.querySelector('.FXScroll');
    fx.scrollTop = top;
    fx.dispatchEvent(new Event('scroll'));
  }, s.top);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `test-${s.name}.png` });
  console.log(`Saved test-${s.name}.png`);
}

await browser.close();

