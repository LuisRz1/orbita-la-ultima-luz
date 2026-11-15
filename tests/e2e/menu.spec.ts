import { expect, test, type Page } from '@playwright/test';
import { achievementIds } from '../../src/core/achievements.ts';

type Api = Record<string, (...args: unknown[]) => unknown>;
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);

test('title menu, English, story dialogue, pause and an achievement', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=moon&debug&quality=low');
  await expect(page.locator('.game-title')).toHaveText('ÓRBITA', { timeout: 30_000 });
  await expect(page.locator('.data-card')).toContainText('1.62 m/s²');

  await page.locator('[data-menu="settings"]').click();
  await page.locator('[data-lang="en"]').click();
  await page.locator('[data-back]').click();
  await expect(page.locator('[data-menu="new"]')).toHaveText('New expedition');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // A new expedition starts inside the lander: each station is one suit decision, then locker and airlock.
  await page.locator('[data-menu="new"]').click();
  await expect(page.getByRole('status', { name: 'Suit status' })).toBeVisible();
  for (const id of ['battery', 'thruster', 'antenna', 'instruments']) {
    await call(page, 'station', id);
    await page.locator(`[data-station="${id}"] [data-confirm]`).click();
  }
  await call(page, 'station', 'locker');
  await call(page, 'station', 'airlock');
  const box = page.locator('[data-dialogue]');
  await expect(box).toContainText('Surface link open');
  for (let i = 0; i < 3; i++) await box.getByRole('button').click();
  await expect(box).toHaveCount(0);

  await call(page, 'pause', true);
  await call(page, 'hold', 'up', true);
  await call(page, 'press', 'dash');
  await call(page, 'step', 3);
  await call(page, 'pause', false);
  await expect(page.locator('[data-toast="first-dash"]')).toContainText('Burst');

  await call(page, 'press', 'pause');
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.locator('[data-pause="menu"]').click();
  await page.locator('[data-menu="achievements"]').click();
  await expect(page.getByRole('dialog', { name: 'Achievements' })).toContainText(`1/${achievementIds.length}`);
  await expect(page.locator('[data-achievement="first-dash"]')).toHaveClass(/got/);
  expect(errors).toEqual([]);
});

test('the title shows the design loop and the route; ?demo opens every destination without touching the saves', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?quality=low');
  await expect(page.locator('[data-loop] li')).toHaveCount(4, { timeout: 30_000 });
  await expect(page.locator('[data-travel-locked="bennu"]')).toBeVisible();
  // Science: every mechanic with its label; every non-fiction row links a NASA page.
  await page.locator('[data-menu="science"]').click();
  await expect(page.locator('[data-science]')).toHaveCount(11);
  for (const row of await page.locator('[data-science]:not([data-basis="fiction"])').all()) await expect(row.locator('a[href*="nasa.gov"]')).toHaveCount(1);
  await expect(page.locator('[data-science="moon-gravity"]')).toContainText('1,62 m/s²');
  await page.locator('[data-back]').click();
  await page.goto('/?demo&quality=low');
  await expect(page.locator('[data-travel="bennu"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-travel="extraction"]')).toBeVisible();
  await page.locator('[data-travel="mars"]').click();
  await expect(page).toHaveURL(/level=mars/);
  await expect(page).toHaveURL(/demo/);
  await expect(page.locator('[data-travel="orbit"]')).toBeVisible({ timeout: 30_000 });
  const saved = await page.evaluate(() => new Promise<number>(resolve => {
    const req = indexedDB.open('orbita-3d');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('progress')) { resolve(0); return; }
      const count = db.transaction('progress', 'readonly').objectStore('progress').count();
      count.onsuccess = () => resolve(count.result);
    };
  }));
  expect(saved).toBe(0);
  expect(errors).toEqual([]);
});
