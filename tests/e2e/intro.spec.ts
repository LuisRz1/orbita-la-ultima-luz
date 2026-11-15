import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);

test('new expedition: narrated prologue, skippable, then the guided suit-up with a recommended-suit shortcut', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=orbit&debug&prologue&quality=low&lang=es');
  await page.locator('[data-menu="new"]').click({ timeout: 30_000 });
  const prologue = page.locator('[data-prologue]');
  await expect(prologue).toBeVisible();
  await expect(page.locator('.prologue-sub')).toContainText('Aurora');
  await page.keyboard.press('Space');
  await expect(prologue).toHaveCount(0);

  // The current suit-up step stays on screen; Q wears the recommended suit and leaves through the airlock.
  const guide = page.locator('[data-guide-step]');
  await expect(guide).toContainText('1/6');
  await expect(page.locator('[data-view-chip]')).toBeVisible();
  await page.keyboard.press('KeyQ');
  await expect(guide).toHaveCount(0);
  await call(page, 'step', 90);
  await expect.poll(async () => (await call(page, 'state') as { phase: string }).phase, { timeout: 15_000 }).toBe('eva');
  expect(errors).toEqual([]);
});

test('V switches to the helmet view live, even with a story line open', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?level=moon&debug&quality=low&lang=es');
  await page.locator('[data-menu="new"]').click({ timeout: 30_000 });
  await page.keyboard.press('KeyQ');
  await call(page, 'step', 90);
  await expect(page.locator('[data-dialogue]')).toBeVisible({ timeout: 15_000 });
  const chip = page.locator('[data-view-chip]');
  await expect(chip).toHaveAttribute('data-view-chip', 'third');
  await call(page, 'press', 'view');
  await call(page, 'step', 2);
  await expect(chip).toHaveAttribute('data-view-chip', 'first');
  await expect(page.locator('[data-visor]')).toBeVisible();
  await call(page, 'press', 'view');
  await call(page, 'step', 2);
  await expect(chip).toHaveAttribute('data-view-chip', 'third');
});
