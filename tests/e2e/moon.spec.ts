import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
/** Closes any story dialogue, which pauses the sortie while it is open. */
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 10 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

async function open(page: Page, design: unknown = 'science') {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?debug&quality=low');
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  await call(page, 'start', design);
  await settle(page);
  return errors;
}

test('the lunar sortie: prerequisites gate the terminal, all six points register and echoes are collected', async ({ page }) => {
  const errors = await open(page);
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[]; collectibles: { id: string; x: number; z: number; y?: number }[] };
  const visit = async (id: string) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
  };
  await visit('terminal');
  let state = await call(page, 'state') as { completed: string[] };
  expect(state.completed).toEqual([]);
  await expect(page.locator('[data-prompt]')).toContainText('requiere');

  for (const id of ['shelter', 'ridge', 'sample', 'archive', 'relay', 'terminal']) await visit(id);
  state = await call(page, 'state') as { completed: string[] };
  expect(state.completed).toEqual(['shelter', 'ridge', 'sample', 'archive', 'relay', 'terminal']);
  await expect(page.locator('[data-objective="terminal"]')).toHaveClass(/done/);

  const echo = level.collectibles.find(c => c.id === 'echo-rift-floor')!;
  await call(page, 'teleport', echo.x, echo.z);
  await call(page, 'step', 2);
  expect((await call(page, 'state') as { collected: string[] }).collected).toContain('echo-rift-floor');
  expect(errors).toEqual([]);
});

test('leaving the radio link warns and then LUMA recalls the player to the lander', async ({ page }) => {
  const errors = await open(page);
  await call(page, 'teleport', 0, 104);
  await call(page, 'step', 20);
  let state = await call(page, 'state') as { signal: number; recalls: number };
  expect(state.signal).toBeLessThan(1);
  await call(page, 'teleport', 125, 0);
  await call(page, 'step', 300);
  state = await call(page, 'state') as { signal: number; recalls: number; x: number; z: number };
  expect(state.recalls).toBe(1);
  expect(Math.hypot(state.x - 0, state.z - 67)).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('running, the double jump and the dash all move the body as tuned', async ({ page }) => {
  const errors = await open(page, { battery: 'light', thruster: 'compact', antenna: 'short', instruments: [] });
  await call(page, 'teleport', 0, 60);
  await call(page, 'look', 0, 0.3);
  const start = await call(page, 'state') as { z: number; y: number };
  await call(page, 'hold', 'up', true);
  await call(page, 'step', 30);
  await call(page, 'press', 'jump'); await call(page, 'hold', 'jump', true);
  await call(page, 'step', 40);
  const single = await call(page, 'state') as { y: number };
  await call(page, 'press', 'jump');
  await call(page, 'step', 30);
  const doubled = await call(page, 'state') as { y: number; grounded: boolean };
  await call(page, 'press', 'dash');
  await call(page, 'step', 12);
  const dashed = await call(page, 'state') as { z: number };
  expect(single.y - start.y).toBeGreaterThan(2);
  expect(doubled.y).toBeGreaterThan(single.y);
  expect(doubled.grounded).toBe(false);
  expect(start.z - dashed.z).toBeGreaterThan(12);
  expect(errors).toEqual([]);
});

test('design, fail, read the report, redesign and complete: the full mission loop through the interface', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?debug&quality=low');
  await page.locator('[data-menu="new"]').click({ timeout: 30_000 });
  await expect(page.getByRole('dialog', { name: 'Diseño de traje' })).toBeVisible();
  await call(page, 'pause', true);
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[] };
  const visit = async (id: string) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
  };

  // First attempt: light proposal without the drill.
  await page.locator('[data-proposal="light"]').click();
  await page.locator('[data-instrument="drill"]').uncheck();
  await expect(page.locator('.checks li.bad')).toContainText('Caché de Aurora');
  await page.locator('[data-start]').click();
  await settle(page);
  for (const id of ['sample', 'relay', 'archive']) await visit(id);
  expect((await call(page, 'state') as { completed: string[] }).completed).toEqual(['sample', 'relay']);
  await call(page, 'setEnergy', 10.05);
  await call(page, 'step', 200);
  const report = page.getByRole('region', { name: 'Informe de salida' });
  await expect(report).toContainText('Repliegue con datos parciales');
  await expect(report.locator('[data-missed="archive"]')).toContainText('taladro');
  await settle(page);

  // Second attempt: redesign with the science proposal and complete the mission.
  await page.locator('[data-redesign]').click();
  await page.locator('[data-proposal="science"]').click();
  await page.locator('[data-start]').click();
  await settle(page);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) await visit(id);
  await call(page, 'step', 120);
  await settle(page);
  await expect(report).toContainText('Transmisión recibida');
  await expect(report).toContainText('4/4');

  // Attempts survive a reload.
  await page.reload();
  await page.locator('[data-menu="continue"]').click({ timeout: 30_000 });
  await expect(page.locator('.history')).toContainText('completa', { timeout: 30_000 });
  await expect(page.locator('.history')).toContainText('repliegue');
  expect(errors).toEqual([]);
});
