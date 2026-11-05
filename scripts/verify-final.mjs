import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto('http://localhost:4199', { waitUntil: 'load' });
await page.waitForTimeout(5000);
await page.screenshot({ path: 'verify-01-home.png' });

const scrollHeight = await page.evaluate(() => document.querySelector('.FXScroll').scrollHeight);

// Chamber check (step 75)
await page.evaluate((top) => {
  const el = document.querySelector('.FXScroll');
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}, scrollHeight * 0.75);
await page.waitForTimeout(2000);
await page.screenshot({ path: 'verify-02-chamber.png' });

// Footer check (step 100)
await page.evaluate((top) => {
  const el = document.querySelector('.FXScroll');
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}, scrollHeight);
await page.waitForTimeout(2000);
await page.screenshot({ path: 'verify-03-footer.png' });

console.log('Errors:', errors);
await browser.close();
console.log('All verification screenshots captured.');
