import { expect, test } from '@playwright/test';

const line = (page: import('@playwright/test').Page, prefix: string) =>
  page.evaluate((p) => ((window as any).__cc.lines as string[]).find((l) => l.startsWith(p)) ?? '', prefix);
const num = async (page: import('@playwright/test').Page, prefix: string, i = 1) => Number((await line(page, prefix)).split(' ')[i]);

test('the test level loads, Pip jumps, the camera scrolls and a crab hit counts, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.scene)).toBe('LEVEL');

  // Jump on the spot: Pip leaves the ground and comes back down.
  const ground = await num(page, 'Y ');
  await page.keyboard.down('Space');
  await page.waitForTimeout(250);
  expect(await num(page, 'Y ')).toBeLessThan(ground - 20);
  await page.keyboard.up('Space');
  await expect.poll(() => num(page, 'Y '), { timeout: 3000 }).toBe(ground);

  // Run right (invincible, so the first crab can't stop us): Pip moves and the camera follows.
  await page.keyboard.press('Backquote'); // debug overlay on
  await page.keyboard.press('KeyI'); // invincible
  const x0 = await num(page, 'X ');
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1300);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ShiftLeft');
  expect(await num(page, 'X ')).toBeGreaterThan(x0 + 60);
  expect(await num(page, 'CAM ')).toBeGreaterThan(0);
  expect(await num(page, 'DEATHS ')).toBe(0);

  // Not invincible any more: walking into the next crab costs a life.
  await page.keyboard.press('KeyI');
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => num(page, 'DEATHS '), { timeout: 8000 }).toBe(1);
  await page.keyboard.up('ArrowRight');

  // External art with no files falls back to code.
  await page.keyboard.press('KeyT');
  await expect.poll(() => line(page, 'ART ')).toBe('ART external');
  expect(await line(page, 'HERO ')).toBe('HERO code');
  expect(errors).toEqual([]);
});
