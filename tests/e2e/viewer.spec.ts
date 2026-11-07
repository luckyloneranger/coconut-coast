import { expect, test } from '@playwright/test';

test('the sprite viewer opens, pages through every sheet and the ground, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/?sprites=1');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.scene)).toBe('SPRITES');
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    seen.add(await page.evaluate(() => (window as any).__cc.lines[0]));
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown'); // next animation too
    await page.waitForTimeout(50);
  }
  expect(seen.size).toBeGreaterThanOrEqual(9);
  expect([...seen].some((l) => l.includes('ground'))).toBe(true);
  expect(errors).toEqual([]);
});
