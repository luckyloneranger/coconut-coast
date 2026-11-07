import { expect, test } from '@playwright/test';

test('sound stays locked until a key is pressed, then plays without errors; M mutes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.scene)).toBe('LEVEL');
  expect(await page.evaluate(() => (window as any).__cc.audio)).toBe('locked');
  await page.keyboard.press('ArrowRight'); // the first key unlocks sound
  await expect.poll(() => page.evaluate(() => (window as any).__cc.audio)).toBe('running');
  // Play a little: walk, jump, collect fruit (music, effects and waves all running).
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => (window as any).__cc.muted)).toBe(false);
  await page.keyboard.press('KeyM');
  await expect.poll(() => page.evaluate(() => (window as any).__cc.muted)).toBe(true);
  await page.keyboard.press('KeyM');
  expect(errors).toEqual([]);
});
