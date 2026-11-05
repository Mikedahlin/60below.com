import { chromium, devices } from 'playwright';

async function testMobile() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await context.newPage();

  console.log('Navigating to https://60below.com on simulated iPhone 14...');
  await page.goto('https://60below.com', { waitUntil: 'load' });
  await page.waitForTimeout(6500);

  const initialInfo = await page.evaluate(() => {
    const fx = document.querySelector('.FXScroll') || document.querySelector('div[style*="overflow-y: scroll"]');
    return {
      fxFound: !!fx,
      tagName: fx ? fx.tagName : null,
      className: fx ? fx.className : null,
      scrollTop: fx ? fx.scrollTop : null,
      scrollHeight: fx ? fx.scrollHeight : null,
      clientHeight: fx ? fx.clientHeight : null,
      scrollV: window.AppState?.get?.('ViewController/scrollV')
    };
  });
  console.log('Initial mobile scroll container info:', initialInfo);

  // Now set scrollTop on the container
  await page.evaluate(() => {
    const fx = document.querySelector('.FXScroll') || document.querySelector('div[style*="overflow-y: scroll"]');
    if (fx) {
      fx.scrollTop = 3000;
      fx.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(2500);

  const afterInfo = await page.evaluate(() => {
    return {
      scrollV: window.AppState?.get?.('ViewController/scrollV'),
      scrollDelta: window.AppState?.get?.('ViewController/scrollDeltaV')
    };
  });
  console.log('After scrolling mobile container:', afterInfo);

  await page.screenshot({ path: 'mobile-scrolled-spine.png' });
  console.log('Captured mobile-scrolled-spine.png');

  // Now scroll further down to the chamber
  await page.evaluate(() => {
    const fx = document.querySelector('.FXScroll') || document.querySelector('div[style*="overflow-y: scroll"]');
    if (fx) {
      fx.scrollTop = 8000;
      fx.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: 'mobile-scrolled-chamber.png' });
  console.log('Captured mobile-scrolled-chamber.png');

  await browser.close();
}

testMobile();

