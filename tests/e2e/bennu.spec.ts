import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 10 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

test('Bennu: anchor, voice, both accesses, archive and sample, then AUR-E06 at the refuge with the sister', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=bennu&debug&quality=low');
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  await call(page, 'start', 'science');
  await settle(page);
  const level = await call(page, 'level') as { points: { id: string; x: number; z: number }[] };
  const visit = async (id: string, keepDialogue = false) => {
    const p = level.points.find(q => q.id === id)!;
    await call(page, 'teleport', p.x, p.z);
    await call(page, 'step', 2);
    await settle(page);
    await call(page, 'press', 'interact');
    await call(page, 'step', 2);
    if (!keepDialogue) await settle(page);
  };
  await visit('access-west');
  expect((await call(page, 'state') as { completed: string[] }).completed).toEqual([]);
  for (const id of ['anchor', 'voice', 'access-east', 'access-west', 'sample', 'archive']) await visit(id);
  // The design without the drill cannot salvage: 'science' carries it, so every point registers.
  await call(page, 'setEnergy', 120);
  await visit('refuge', true);
  const state = await call(page, 'state') as { completed: string[] };
  expect(state.completed).toContain('refuge');
  await call(page, 'step', 90);
  await expect(page.locator('[data-dialogue]')).toContainText('AURORA');
  expect(errors).toEqual([]);
});

test('Bennu microgravity: a jump hangs long and the anchor line caps the height', async ({ page }) => {
  await page.goto('/?level=bennu&debug&quality=low');
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  await call(page, 'start', 'science');
  await settle(page);
  await call(page, 'teleport', -20, 60);
  await call(page, 'step', 5);
  const y0 = (await call(page, 'state') as { y: number }).y;
  await call(page, 'press', 'jump'); await call(page, 'hold', 'jump', true);
  let peak = y0, airborne = 0;
  for (let i = 0; i < 60; i++) {
    await call(page, 'step', 10);
    const s = await call(page, 'state') as { y: number };
    peak = Math.max(peak, s.y); if (s.y > y0 + 0.05) airborne += 10;
    if (i === 20) { await call(page, 'press', 'jump'); }
  }
  expect(peak - y0).toBeLessThanOrEqual(6.2);
  expect(peak - y0).toBeGreaterThan(2.5);
  expect(airborne / 60).toBeGreaterThan(3);
});
