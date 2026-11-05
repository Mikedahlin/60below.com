import { chromium, devices } from 'playwright';

async function testTouch() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await context.newPage();
  await page.goto('https://60below.com', { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  // Inject touch bridge
  await page.evaluate(() => {
    let lastY = 0;
    window.addEventListener('touchstart', e => {
      if (e.touches.length === 1) lastY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) {
        const delta = lastY - e.touches[0].clientY;
        lastY = e.touches[0].clientY;
        const fx = document.querySelector('.FXScroll') || document.querySelector('div[style*="overflow-y: scroll"]');
        if (fx) fx.scrollTop += delta * 2.5;
      }
    }, { passive: true });
  });

  // Dispatch real TouchEvents
  for (let s = 0; s < 4; s++) {
    await page.evaluate(async () => {
      const dispatch = (type, y) => {
        const touch = new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y, pageX: 200, pageY: y });
        const evt = new TouchEvent(type, { touches: type === 'touchend' ? [] : [touch], changedTouches: [touch], bubbles: true, cancelable: true });
        window.dispatchEvent(evt);
      };
      dispatch('touchstart', 600);
      for (let y = 560; y >= 160; y -= 40) {
        dispatch('touchmove', y);
        await new Promise(r => setTimeout(r, 25));
      }
      dispatch('touchend', 160);
    });
    await page.waitForTimeout(600);
  }

  const state = await page.evaluate(() => {
    return {
      scrollV: window.AppState?.get?.('ViewController/scrollV'),
      scrollDelta: window.AppState?.get?.('ViewController/scrollDeltaV')
    };
  });
  console.log('Mobile scroll state after touch swipes:', state);
  await page.screenshot({ path: 'mobile-touch-success.png' });
  console.log('Captured mobile-touch-success.png');
  await browser.close();
}

testTouch();
