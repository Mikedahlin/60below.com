import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:4199', { waitUntil: 'load' });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  const fx = document.querySelector('.FXScroll');
  fx.scrollTop = fx.scrollHeight;
  fx.dispatchEvent(new Event('scroll'));
});
await page.waitForTimeout(2000);

// In Footer.startRender, rotation is continuously written.
// So we hook startRender or replace rotation logic:
const configs = [
  { name: 'rx0', rx: 0 },
  { name: 'rxPI', rx: Math.PI }
];

for (const cfg of configs) {
  await page.evaluate((c) => {
    const cont = Container.instance();
    const vc = Object.values(cont.classes).find(obj => (obj.___constructorName || obj.fragName) === 'ViewController');
    const footer = Object.values(vc.classes).find(obj => (obj.___constructorName || obj.fragName) === 'Footer');
    if (footer) {
      // override on render
      footer.layers.particles.layers.logo.rotation.x = c.rx;
    }
  }, cfg);
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'rot-' + cfg.name + '.png' });
}
await browser.close();
console.log('Tested footer rotations');

