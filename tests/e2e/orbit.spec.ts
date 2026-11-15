import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
type State = { completed: string[]; luma: boolean; level: string; recalls: number; x: number; z: number; ledger: Record<string, number> };
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

async function begin(page: Page) {
  await page.goto('/?debug&quality=low');
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  await call(page, 'start', 'light');
  await settle(page);
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

test('chapter 1 opens by default: LUMA joins at the protected bay, the airlock validates AUR-E01/E02 and the Moon opens', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await page.goto('/?debug&quality=low');
  await expect(page.locator('.data-card')).toContainText('AURORA / C1');
  await expect(page.locator('[data-travel-locked="moon"]')).toBeVisible();
  const visit = await begin(page);

  expect((await call(page, 'state') as State).luma).toBe(false);
  await visit('protected-bay');
  expect((await call(page, 'state') as State).completed).toEqual([]);
  for (const id of ['supplies', 'capsule']) await visit(id);
  expect((await call(page, 'state') as State).luma).toBe(false);
  await visit('protected-bay');
  expect((await call(page, 'state') as State).luma).toBe(true);
  for (const id of ['translator', 'sun-record', 'recorder', 'airlock']) await visit(id);
  const state = await call(page, 'state') as State;
  expect(state.completed).toEqual(['supplies', 'capsule', 'protected-bay', 'translator', 'sun-record', 'recorder', 'airlock']);

  await call(page, 'step', 120);
  await settle(page);
  const report = page.getByRole('region', { name: 'Informe de salida' });
  await expect(report).toContainText('Transmisión recibida');
  await expect(report).toContainText('7/7');
  await expect(report.locator('[data-outcome]')).toContainText('AUR-E02');
  const next = page.locator('[data-next="moon"]');
  await expect(next).toContainText('Continuar a Luna');
  await next.click();
  await page.waitForURL(/level=moon/);
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await expect(page.locator('.data-card')).toContainText('AURORA / C2');
  await expect(page.locator('[data-travel="orbit"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('stepping off a station deck: the safety tether brings the player back to the dock', async ({ page }) => {
  const errors = watch(page);
  await begin(page);
  await call(page, 'teleport', 20, 0);
  await call(page, 'step', 400);
  await settle(page);
  const state = await call(page, 'state') as State;
  expect(state.recalls).toBe(1);
  expect(Math.hypot(state.x - 0, state.z - 67)).toBeLessThan(1);
  expect(errors).toEqual([]);
});
