import { expect, test } from '@playwright/test';

test('the movement lab loads, Pip walks and jumps, and art can switch, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.scene)).toBe('TEST ROOM');
  const x = () => page.evaluate(() => Number((window as any).__cc.lines[0].split(' ')[1]));
  const before = await x();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  expect(await x()).toBeGreaterThan(before + 20);
  // Jump: Pip leaves the ground and comes back down.
  const y = () => page.evaluate(() => Number((window as any).__cc.lines[1].split(' ')[1]));
  const ground = await y();
  await page.keyboard.down('Space');
  await page.waitForTimeout(250);
  expect(await y()).toBeLessThan(ground - 20);
  await page.keyboard.up('Space');
  await expect.poll(y, { timeout: 3000 }).toBe(ground);
  // External art with no files falls back to code without errors.
  await page.keyboard.press('KeyT');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.lines[2])).toBe('ART external');
  expect(await page.evaluate(() => (window as any).__cc.lines[3])).toBe('HERO code');
  expect(errors).toEqual([]);
});
