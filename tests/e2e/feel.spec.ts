import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
type State = { cinematic: boolean; dialogue: boolean; view: string; photo: boolean; gamePaused: boolean; x: number; z: number; fov: number; camera: number[]; y: number; energy: number };
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
const state = async (page: Page) => await call(page, 'state') as State;
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 12 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

async function open(page: Page, query: string) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=moon&debug&quality=low' + query);
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  return errors;
}

test('the arrival shot plays the title card, holds the intro until it ends and can be skipped', async ({ page }) => {
  const errors = await open(page, '&cinematic');
  await call(page, 'start', 'science');
  await call(page, 'step', 2);
  let s = await state(page);
  expect(s.cinematic).toBe(true);
  expect(s.dialogue).toBe(false);
  await call(page, 'step', 120);
  await expect(page.locator('[data-cinematic]')).toContainText('Bajo otro cielo');
  await expect(page.locator('.mission')).toHaveCount(0);
  // The sortie clock does not run during the shot.
  expect((await state(page)).energy).toBe(120);
  await call(page, 'press', 'interact');
  await call(page, 'step', 2);
  s = await state(page);
  expect(s.cinematic).toBe(false);
  expect(s.dialogue).toBe(true);
  await settle(page);
  await expect(page.locator('[data-cinematic]')).toHaveCount(0);
  await expect(page.locator('.mission')).toBeVisible();
  // A later sortie in the same visit goes straight in.
  await call(page, 'start', 'science');
  await call(page, 'step', 2);
  expect((await state(page)).cinematic).toBe(false);
  expect(errors).toEqual([]);
});

test('the helmet view puts the camera at eye height with a visor, and the photo mode freezes the sortie', async ({ page }) => {
  const errors = await open(page, '');
  await call(page, 'start', 'science');
  await settle(page);
  await call(page, 'press', 'view');
  await call(page, 'step', 2);
  let s = await state(page);
  expect(s.view).toBe('first');
  expect(Math.hypot(s.camera[0] - s.x, s.camera[2] - s.z)).toBeLessThan(0.2);
  expect(s.camera[1] - s.y).toBeGreaterThan(1.3);
  await expect(page.locator('[data-visor]')).toBeVisible();
  await expect(page.locator('.energy-panel')).toBeHidden();
  // The helmet replaces the corner panels with its own tape, gauges, scope and LUMA slot.
  for (const part of ['hud', 'chin', 'battery', 'link', 'radar', 'luma']) await expect(page.locator(`[data-helmet-${part}]`)).toBeVisible();
  for (const panel of ['.compass', '.telemetry', '.luma-card']) await expect(page.locator(panel)).toBeHidden();
  await expect(page.locator('[data-helmet-battery]')).toHaveAttribute('data-helmet-battery', 'ok');
  // Movement still collides and walks as usual.
  await call(page, 'look', 0, 0.32);
  await call(page, 'hold', 'up', true);
  await call(page, 'step', 60);
  await call(page, 'hold', 'up', false);
  s = await state(page);
  expect(s.z).toBeLessThan(66);
  // The dash opens the field of view for a moment.
  await call(page, 'press', 'dash');
  await call(page, 'step', 3);
  expect((await state(page)).fov).toBeGreaterThan(62);
  await call(page, 'press', 'view');
  await call(page, 'step', 2);
  expect((await state(page)).view).toBe('third');
  await expect(page.locator('[data-visor]')).toHaveCount(0);
  for (const panel of ['.compass', '.telemetry', '.energy-panel']) await expect(page.locator(panel)).toBeVisible();

  await call(page, 'press', 'photo');
  await call(page, 'step', 2);
  const before = await state(page);
  expect(before.photo).toBe(true);
  await expect(page.locator('[data-photo]')).toBeVisible();
  await expect(page.locator('.mission')).toHaveCount(0);
  await call(page, 'hold', 'up', true);
  await call(page, 'step', 120);
  await call(page, 'hold', 'up', false);
  const frozen = await state(page);
  expect(frozen.z).toBe(before.z);
  expect(frozen.energy).toBe(before.energy);
  await call(page, 'press', 'pause');
  await call(page, 'step', 2);
  const after = await state(page);
  expect(after.photo).toBe(false);
  expect(after.gamePaused).toBe(false);
  expect(errors).toEqual([]);
});
