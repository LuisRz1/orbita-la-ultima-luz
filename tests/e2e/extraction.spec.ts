import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 12 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

test('extraction: everyone aboard, the undocking jams, LUMA frees it, is carried home and does not come back', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const open = async () => {
    await page.goto('/?level=extraction&debug&quality=low');
    await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
    await call(page, 'pause', true);
    await call(page, 'start', 'science');
    await settle(page);
  };
  await open();
  expect((await call(page, 'state') as { luma: boolean }).luma).toBe(true);
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[] };
  const visit = async (id: string) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'setEnergy', 120);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
  };
  for (const id of ['boarding', 'cargo', 'life-support', 'reserves']) { await visit(id); await settle(page); }
  await visit('undock');
  await expect(page.locator('[data-dialogue]')).toContainText('atascado');
  for (let i = 0; i < 3; i++) await call(page, 'advance');
  await expect(page.locator('[data-dialogue]')).toContainText('Quiero hacerlo');
  await settle(page);
  await visit('safe-bay');
  expect((await call(page, 'state') as { completed: string[] }).completed).toContain('safe-bay');
  await call(page, 'step', 90);
  await expect(page.locator('[data-dialogue]')).toContainText('caliente');
  await settle(page);
  // The report opens the epilogue (M06 told): every survivor received, AUR-E07.
  await call(page, 'step', 200);
  await page.locator('[data-epilogue-open]').click();
  await expect(page.locator('[data-epilogue]')).toContainText('AUR-E07');
  await expect(page.locator('[data-absence]')).toContainText('Pulsas F por costumbre');
  await page.locator('[data-epilogue-close]').click();
  // Death is permanent: a new sortie on this destination has no LUMA.
  await call(page, 'step', 200);
  await open();
  expect((await call(page, 'state') as { luma: boolean }).luma).toBe(false);
  // Its abilities went with it: the card stays as an empty place and F finds nobody.
  await call(page, 'step', 2);
  await expect(page.locator('[data-luma="gone"]')).toContainText('En memoria');
  await call(page, 'press', 'luma');
  await call(page, 'step', 2);
  await expect(page.locator('.notice')).toContainText('Nadie corre delante');
  expect((await call(page, 'state') as { lumaAbilities: { sniffs: number } }).lumaAbilities.sniffs).toBe(0);
  expect(errors).toEqual([]);
});
