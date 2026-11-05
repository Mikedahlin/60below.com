import { chromium } from 'playwright';

async function scanSpine() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4199', { waitUntil: 'load' });
  await page.waitForTimeout(6500);

  // Find scroll container
  const totalSteps = 20;
  for (let i = 1; i <= totalSteps; i++) {
    await page.evaluate(({ step, total }) => {
      const fx = document.querySelector('.FXScroll') || document.querySelector('div[style*="overflow-y: scroll"]');
      if (fx) {
        fx.scrollTop = (fx.scrollHeight - fx.clientHeight) * (step / total);
        fx.dispatchEvent(new Event('scroll'));
      }
    }, { step: i, total: totalSteps });
    await page.waitForTimeout(1000);
    const scrollInfo = await page.evaluate(() => ({
      scrollV: window.AppState?.get?.('ViewController/scrollV'),
      routerState: window.AppState?.get?.('Router/state')
    }));
    await page.screenshot({ path: `spine-scan-${i}.png` });
    console.log(`Step ${i}/${totalSteps}:`, scrollInfo);
  }
  await browser.close();
}

scanSpine();
