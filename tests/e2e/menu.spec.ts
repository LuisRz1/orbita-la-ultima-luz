import { expect, test, type Page } from '@playwright/test';
import { prepareShip } from './helpers/ship.ts';

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

  await page.locator('[data-menu="new"]').click();
  await prepareShip(page,{first:true});
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
  await expect(page.getByRole('dialog', { name: 'Achievements' })).toContainText('1/10');
  await expect(page.locator('[data-achievement="first-dash"]')).toHaveClass(/got/);
  expect(errors).toEqual([]);
});
