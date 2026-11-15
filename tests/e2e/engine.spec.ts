import { expect, test } from '@playwright/test';

test('the 3D entry renders frames, steps deterministically and reports no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=moon&debug');
  await expect(page.locator('canvas.game-canvas')).toBeVisible();
  await page.waitForFunction(() => typeof window.__orbita?.perf === 'function');
  await expect(page.locator('[data-perf="frame"]')).not.toHaveText('0.0');
  const result = await page.evaluate(() => {
    const api = window.__orbita as unknown as {
      pause(value: boolean): void; step(count: number): void;
      state(): { steps: number }; perf(): { drawCalls: number; width: number };
    };
    api.pause(true);
    const before = api.state().steps;
    api.step(30);
    return { advanced: api.state().steps - before, perf: api.perf() };
  });
  expect(result.advanced).toBe(30);
  expect(result.perf.drawCalls).toBeGreaterThan(0);
  expect(result.perf.width).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('setup opens first, saves preferences and starts First Light without debug controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Configura tu partida' })).toBeVisible();
  await expect(page.locator('canvas.game-canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Low', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set up your game' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Play First Light' }).click();
  await expect(page.getByRole('dialog', { name: 'Prologue' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('.campaign-game[data-stage="ground"]')).toBeVisible();
  await expect(page.locator('[data-next]')).toContainText('Access Mission Control');
  await expect(page.locator('canvas.game-canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up your game' })).toHaveCount(0);
  expect(await page.evaluate(() => window.__orbita)).toBeUndefined();
});
