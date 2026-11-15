import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
type State = { completed: string[]; storm: boolean; zone: string | null; ledger: Record<string, number>; collected: string[]; level: string };
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 10 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

function watch(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function ready(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
}

async function visitor(page: Page) {
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[] };
  return async (id: string) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
    await settle(page);
  };
}

test('Mars: the habitat gates the log, the relay sets off the dust storm and the terminal authenticates the trail', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await ready(page, '/?level=mars&debug&quality=low');
  await expect(page.locator('.data-card')).toContainText('AURORA / C3');
  await expect(page.locator('.data-card')).toContainText('3.71');
  await call(page, 'pause', true);
  await call(page, 'start', 'light');
  await settle(page);
  const visit = await visitor(page);

  await visit('terminal');
  await expect(page.locator('[data-prompt]')).toContainText('requiere');
  await visit('logbook');
  expect((await call(page, 'state') as State).completed).toEqual([]);

  // Before the relay the dunes cost little; after it, the storm makes them expensive.
  await call(page, 'teleport', -4, -16);
  await call(page, 'step', 60);
  await settle(page);
  const calm = (await call(page, 'state') as State).ledger.dust;
  expect(calm).toBeGreaterThan(0);
  for (const id of ['habitat', 'logbook', 'relay']) await visit(id);
  let state = await call(page, 'state') as State;
  expect(state.storm).toBe(true);
  await call(page, 'teleport', -4, -16);
  await call(page, 'step', 60);
  await settle(page);
  state = await call(page, 'state') as State;
  expect(state.ledger.dust - calm).toBeGreaterThan(calm * 3);

  for (const id of ['field-kit', 'outcrop', 'terminal']) await visit(id);
  state = await call(page, 'state') as State;
  expect(state.completed).toEqual(['habitat', 'logbook', 'relay', 'field-kit', 'outcrop', 'terminal']);
  await call(page, 'step', 120);
  await settle(page);
  const report = page.getByRole('region', { name: 'Informe de salida' });
  await expect(report).toContainText('Transmisión recibida');
  await expect(report).toContainText('6/6');
  await expect(report.locator('[data-outcome]')).toContainText('Bennu');
  await expect(report).toContainText('Polvo y viento');
  expect(errors).toEqual([]);
});

test('completing the Moon opens Mars from the report, and Mars keeps its own save', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await ready(page, '/?level=moon&debug&quality=low');
  await expect(page.locator('[data-travel-locked="mars"]')).toBeVisible();
  await call(page, 'pause', true);
  await call(page, 'start', 'science');
  await settle(page);
  const visit = await visitor(page);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) await visit(id);
  await call(page, 'step', 120);
  await settle(page);
  const next = page.locator('[data-next="mars"]');
  await expect(next).toContainText('Continuar a Marte');
  await next.click();
  await page.waitForURL(/level=mars/);
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await expect(page.locator('.data-card')).toContainText('AURORA / C3');
  await expect(page.locator('[data-travel="moon"]')).toBeVisible();
  const state = await call(page, 'state') as State & { attempts: number };
  expect(state.level).toBe('mars');
  expect(state.attempts).toBe(0);
  expect(errors).toEqual([]);
});
