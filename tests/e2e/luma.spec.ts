import { expect, test, type Page } from '@playwright/test';

type Api = Record<string, (...args: unknown[]) => unknown>;
type Abilities = { readyIn: number; fetchesLeft: number; warned: string[]; sniffs: number; running: boolean; fetching: string | null; warmth: number; relief: number; trail: number };
type State = { lumaAbilities: Abilities; collected: string[]; zone: string | null; ledger: Record<string, number>; y: number };
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => (window.__orbita as unknown as Api)[fn as string](...(args as unknown[])), [fn, args] as const);
const state = async (page: Page) => await call(page, 'state') as State;
const settle = (page: Page) => page.evaluate(() => {
  const api = window.__orbita as unknown as Api;
  for (let i = 0; i < 12 && (api.state() as { dialogue: boolean }).dialogue; i++) api.advance();
});

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?level=moon&debug&quality=low');
  await page.waitForFunction(() => typeof window.__orbita?.teleport === 'function', null, { timeout: 30_000 });
  await call(page, 'pause', true);
  await call(page, 'start', 'science');
  await settle(page);
  return errors;
}

test('LUMA tracks a scent on F, then needs to catch its breath', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('[data-luma="ready"]')).toBeVisible();
  await call(page, 'press', 'luma');
  await call(page, 'step', 2);
  let s = (await state(page)).lumaAbilities;
  expect(s.sniffs).toBe(1);
  expect(s.running).toBe(true);
  expect(s.trail).toBeGreaterThan(0);
  expect(s.readyIn).toBeGreaterThan(15);
  await expect(page.locator('.notice')).toContainText('LUMA olfatea');
  await call(page, 'step', 300);
  await settle(page);
  await call(page, 'press', 'luma');
  await call(page, 'step', 2);
  await expect(page.locator('.notice')).toContainText('recupera el aliento');
  s = (await state(page)).lumaAbilities;
  expect(s.sniffs).toBe(1);
  // The cooldown runs on mission time and ends.
  await call(page, 'step', 60 * 16);
  await settle(page);
  expect((await state(page)).lumaAbilities.readyIn).toBe(0);
  expect(errors).toEqual([]);
});

test('LUMA bristles before the shadowed crater and its glow spares part of the cold', async ({ page }) => {
  const errors = await open(page);
  await call(page, 'teleport', 26, -8);
  await call(page, 'look', -Math.PI / 2, 0.3);
  await call(page, 'hold', 'up', true);
  await call(page, 'step', 60);
  await call(page, 'hold', 'up', false);
  expect((await state(page)).lumaAbilities.warned).toContain('shadow');
  await expect(page.locator('.notice')).toContainText('eriza las orejas');
  await call(page, 'teleport', 58, -4);
  await call(page, 'step', 4);
  await settle(page);
  await call(page, 'step', 240);
  await settle(page);
  const s = await state(page);
  expect(s.zone).toBe('shadow');
  expect(s.lumaAbilities.relief).toBeGreaterThan(0);
  expect(s.lumaAbilities.warmth).toBeGreaterThan(0);
  // The suit still pays most of the cold.
  expect(s.ledger.cold).toBeGreaterThan(s.lumaAbilities.warmth);
  await expect(page.locator('[data-luma-warm="on"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('LUMA floats up to a ledge for an echo the suit cannot reach, once per sortie', async ({ page }) => {
  const errors = await open(page);
  const level = await call(page, 'level') as { collectibles: { id: string; x: number; z: number; y?: number }[] };
  const high = level.collectibles.filter(c => c.y !== undefined).sort((a, b) => b.y! - a.y!)[0];
  await call(page, 'teleport', high.x + 3, high.z);
  await call(page, 'step', 2);
  await settle(page);
  expect(high.y! - (await state(page)).y).toBeGreaterThan(2.3);
  await expect(page.locator('[data-luma]')).toContainText('Alcanzar eco');
  await call(page, 'press', 'luma');
  await call(page, 'step', 2);
  expect((await state(page)).lumaAbilities.fetching).toBe(high.id);
  await call(page, 'step', 150);
  await settle(page);
  const s = await state(page);
  expect(s.collected).toContain(high.id);
  expect(s.lumaAbilities.fetchesLeft).toBe(0);
  // No fetch left: F tracks instead.
  await call(page, 'press', 'luma');
  await call(page, 'step', 2);
  expect((await state(page)).lumaAbilities.sniffs).toBe(1);
  expect(errors).toEqual([]);
});
