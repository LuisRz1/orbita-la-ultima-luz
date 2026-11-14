import { expect, test } from '@playwright/test';

test('the 3D entry renders frames, steps deterministically and reports no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?debug');
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

test('without the debug flag the page exposes no debug surface', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas.game-canvas')).toBeVisible();
  expect(await page.evaluate(() => window.__orbita)).toBeUndefined();
});
