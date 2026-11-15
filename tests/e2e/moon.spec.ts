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
  await page.goto('/?level=moon&debug&quality=low');
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
  // The mission panel names a doable objective with its distance, never the terminal while others are pending.
  await expect(page.locator('[data-next]')).not.toContainText('vuelve al módulo');
  await expect(page.locator('[data-mark]').first()).toBeVisible();

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
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=moon&debug&quality=low');
  await page.locator('[data-menu="new"]').click({ timeout: 30_000 });
  await expect(page.getByRole('status', { name: 'Estado del traje' })).toBeVisible();
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[] };
  /** Opens a station in the lander, applies the clicks and confirms it. */
  const station = async (id: string, ...clicks: string[]) => {
    await call(page, 'station', id);
    for (const c of clicks) await page.locator(`[data-station="${id}"] ${c}`).click();
    await page.locator(`[data-station="${id}"] [data-confirm]`).click();
  };
  /** Helmet from the locker, then out through the airlock; the sortie starts once the exit fade ends. */
  const leave = async () => {
    await call(page, 'station', 'locker');
    await call(page, 'station', 'airlock');
    await page.waitForFunction(() => (window.__orbita as unknown as Api).state().phase === 'eva', null, { timeout: 15_000 });
    await call(page, 'pause', true);
  };
  const visit = async (id: string) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
  };

  // First attempt: the default light suit without the drill. The top bar marks the cache as impossible.
  for (const id of ['battery', 'thruster', 'antenna']) await station(id);
  await station('instruments', '[data-instrument="drill"]');
  await expect(page.locator('.ship-bar .goals b.bad')).toHaveAttribute('title', 'Caché de Aurora');
  // The requirements panel says the same before leaving, with the cost of each objective for this suit.
  await expect(page.locator('[data-brief-row="archive"]')).toHaveClass(/bad/);
  await expect(page.locator('[data-brief-row="relay"]')).toContainText('12 u.');
  await leave();
  await settle(page);
  for (const id of ['sample', 'relay', 'archive']) await visit(id);
  expect((await call(page, 'state') as { completed: string[] }).completed).toEqual(['sample', 'relay']);
  // Reaching the reserve starts the walk home; arriving at the lander ends the sortie as a safe recall.
  await call(page, 'setEnergy', 6.05);
  await call(page, 'step', 60);
  await expect(page.locator('[data-next]')).toContainText('vuelve al módulo');
  await call(page, 'teleport', 0, 67);
  await call(page, 'step', 120);
  const report = page.getByRole('region', { name: 'Informe de salida' });
  await expect(report).toContainText('Repliegue con datos parciales');
  await expect(report.locator('[data-missed="archive"]')).toContainText('taladro');
  // The debrief: battery chart with the two objectives done, the decision table and a concrete proposal.
  await expect(report.locator('[data-chart-point]')).toHaveCount(2);
  await expect(report.locator('[data-chart-mark="reserve"]')).toHaveCount(1);
  await expect(report.locator('[data-link="instruments"]')).toHaveClass(/bad/);
  await expect(report.locator('[data-advice="instrument"]')).toContainText('taladro');
  await expect(report.locator('[data-compare]')).toHaveCount(0);
  await settle(page);

  // Second attempt: redesign toward the science proposal (bigger battery, drill instead of kit) and complete.
  await page.locator('[data-redesign]').click();
  await call(page, 'pause', false);
  await station('battery', '[data-option="extended"]');
  await station('instruments', '[data-instrument="drill"]', '[data-instrument="kit"]');
  await expect(page.locator('.ship-bar .goals b.bad')).toHaveCount(0);
  await leave();
  await settle(page);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) await visit(id);
  await call(page, 'step', 120);
  await settle(page);
  await expect(report).toContainText('Transmisión recibida');
  await expect(report).toContainText('4/4');
  await expect(report.locator('[data-compare] [data-change="battery"]')).toContainText('Batería extendida');
  await expect(report.locator('[data-compare]')).toContainText('2 → 4');

  // Attempts survive a reload.
  await page.reload();
  await page.locator('[data-menu="continue"]').click({ timeout: 30_000 });
  await expect(page.locator('.history')).toContainText('2', { timeout: 30_000 });
  await expect(page.locator('.history')).toContainText('completa', { timeout: 30_000 });
  await expect(page.locator('.history')).toContainText('repliegue');
  expect(errors).toEqual([]);
});

test('a proposal from the report loads into the lander and the suit can leave with it', async ({ page }) => {
  const errors = await open(page, { battery: 'standard', thruster: 'compact', antenna: 'medium', instruments: ['camera', 'kit'] });
  await call(page, 'setEnergy', 6.05);
  await call(page, 'step', 60);
  await call(page, 'teleport', 0, 67);
  await call(page, 'step', 120);
  await settle(page);
  const report = page.getByRole('region', { name: 'Informe de salida' });
  await expect(report).toContainText('Repliegue con datos parciales');
  await report.locator('[data-apply="instrument"]').click();
  expect((await call(page, 'state') as { phase: string }).phase).toBe('ship');
  await expect(page.locator('.ship-bar .goals b.bad')).toHaveCount(0);
  await call(page, 'pause', false);
  await call(page, 'station', 'locker');
  await call(page, 'station', 'airlock');
  await page.waitForFunction(() => (window.__orbita as unknown as Api).state().phase === 'eva', null, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('an atlas rock is catalogued with the camera for one unit and stays dim once scanned', async ({ page }) => {
  const errors = await open(page);
  // Anorthosite, west of the landing site (LUNA-NACAR.md).
  await call(page, 'teleport', -10, 19.5);
  await call(page, 'step', 2);
  await settle(page);
  await expect(page.locator('[data-prompt]')).toContainText('Anortosita');
  const before = (await call(page, 'state') as { energy: number }).energy;
  await call(page, 'press', 'interact');
  await call(page, 'step', 2);
  await expect(page.locator('[data-atlas]')).toContainText('1/6');
  const after = (await call(page, 'state') as { energy: number }).energy;
  expect(before - after).toBeGreaterThanOrEqual(1);
  await expect(page.locator('[data-prompt]')).toHaveCount(0);
  // The card stays readable from the main menu, with its source.
  await call(page, 'pause', false);
  await page.keyboard.press('Escape');
  await page.locator('[data-pause="menu"]').click();
  await page.locator('[data-menu="journal"]').click();
  await expect(page.locator('[data-entry="rock-anorthosite"]')).toContainText('15415');
  await expect(page.locator('[data-entry="rock-basalt"]')).toContainText('Roca sin catalogar');
  expect(errors).toEqual([]);
});

test('the Aurora beacons light one by one and the last gives the hint towards the west bowl', async ({ page }) => {
  const errors = await open(page);
  for (const [x, z] of [[-12, 60], [-24, 40], [-34, 18], [-40, -8]]) {
    await call(page, 'teleport', x + 1.2, z);
    await call(page, 'step', 2);
    await settle(page);
    await expect(page.locator('[data-prompt]')).toContainText('Baliza');
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
  }
  await expect(page.locator('[data-beacons]')).toContainText('4/4');
  await expect(page.getByText('cuenco del oeste')).toBeVisible();
  expect(errors).toEqual([]);
});

test('opening the buried shelter costs energy and shows the first journal page', async ({ page }) => {
  const errors = await open(page);
  await call(page, 'teleport', -40.5, -24);
  await call(page, 'step', 2);
  await settle(page);
  await expect(page.locator('[data-prompt]')).toContainText('Refugio sepultado');
  await call(page, 'press', 'interact');
  await call(page, 'step', 2);
  await expect(page.locator('[data-dialogue]')).toContainText('Día 12');
  await expect(page.locator('[data-pages]')).toContainText('1/3');
  expect(errors).toEqual([]);
});

test('the seismic network: pick up the geophones at the crate and plant all three for the card', async ({ page }) => {
  const errors = await open(page);
  const act = async (x: number, z: number) => {
    await call(page, 'teleport', x, z); await call(page, 'step', 2); await settle(page);
    await call(page, 'press', 'interact'); await call(page, 'step', 2);
  };
  await act(4, 79.5);
  await expect(page.getByText('Llevas 3 geófonos')).toBeVisible();
  await act(-24, 47); await act(40, 11);
  await call(page, 'setEnergy', 120);
  await act(-34, -7);
  await expect(page.getByText('Red sísmica completa')).toBeVisible();
  // The network earns the «Sismo» patch, worn from the menu.
  await call(page, 'pause', false);
  await page.keyboard.press('Escape');
  await page.locator('[data-pause="menu"]').click();
  await page.locator('[data-menu="journal"]').click();
  await page.locator('[data-patch="sismo"] button').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('orbita-3d-prefs')!).patch)).toBe('sismo');
  expect(errors).toEqual([]);
});
