import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));

const loginRes = await fetch('http://localhost/api/v1/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'Investicaco@gmail.com', password: 'ADMIN' }),
});
const loginData = await loginRes.json();

await page.goto('http://localhost/', { waitUntil: 'domcontentloaded' });
await page.evaluate(({ access, refresh, userId }) => {
  localStorage.setItem('vmp_tokens', JSON.stringify({ access, refresh }));
  localStorage.removeItem(`volunteer_management_onboarding_${userId}`);
}, { access: loginData.access, refresh: loginData.refresh, userId: loginData.user.id });

await page.goto('http://localhost/dashboard', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const probe = await page.evaluate(() => {
  const nodes = Array.from(document.querySelectorAll('[data-tour="nav-dashboard"]'));
  return nodes.map((el) => {
    const modal = el.closest('.MuiModal-root, .MuiDrawer-modal');
    const docked = el.closest('.MuiDrawer-docked, [data-tour-drawer="desktop"]');
    const r = el.getBoundingClientRect();
    return {
      text: (el.textContent || '').trim().slice(0, 40),
      ariaHidden: modal?.getAttribute('aria-hidden'),
      modalHidden: modal?.classList.contains('MuiModal-hidden') ?? false,
      docked: Boolean(docked),
      drawer: el.closest('[data-tour-drawer]')?.getAttribute('data-tour-drawer'),
      w: Math.round(r.width),
      h: Math.round(r.height),
      left: Math.round(r.left),
      top: Math.round(r.top),
    };
  });
});

// Start tour via guide
await page.evaluate(() => window.__resetOnboardingTour?.());
await page.waitForTimeout(400);
const guide = page.locator('[data-tour="nav-guide"]').first();
if (await guide.count()) await guide.click({ force: true });
await page.waitForTimeout(800);
const start = page.getByRole('button', { name: /شروع/ });
if (await start.count()) await start.first().click();
await page.waitForTimeout(1500);
const next = page.getByRole('button', { name: /^بعدی$/ });
if (await next.count()) await next.first().click();
await page.waitForTimeout(2000);

const afterNext = await page.evaluate(() => {
  const title = document.getElementById('onboarding-tour-title')?.textContent || '';
  const clone = document.querySelector('[data-tour-clone="true"]');
  const cloneText = (clone?.textContent || '').trim().slice(0, 60);
  const stage = clone?.closest('[aria-hidden]')?.parentElement;
  // find fixed stage
  const stages = Array.from(document.querySelectorAll('body > div')).filter(Boolean);
  return { title, cloneText, errors: [] };
});

console.log(JSON.stringify({ probe, afterNext, errors: errors.slice(0, 10) }, null, 2));
await browser.close();
