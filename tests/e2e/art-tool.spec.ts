import { expect, test } from '@playwright/test';

test('the art cleanup tool turns a made-up generated image into a sheet, with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/?art-tool=1');
  await expect(page.getByRole('heading', { name: /cleanup tool/i })).toBeVisible();
  await page.selectOption('select', 'urchin');
  // Make a "generated" image in the page (magenta background, 5 blobs drawn at 6x) and pick it as the file.
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 140;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ff00ff';
    g.fillRect(0, 0, 600, 140);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = '#8a4cc8';
      g.fillRect(20 + i * 110, 30, 16 * 6, 16 * 6);
      g.fillStyle = '#ffffff';
      g.fillRect(40 + i * 110, 50, 12, 12);
    }
    const blob = await new Promise<Blob>((done) => c.toBlob((b) => done(b!), 'image/png'));
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    const files = new DataTransfer();
    files.items.add(new File([blob], 'urchin-raw.png', { type: 'image/png' }));
    input.files = files.files;
    input.dispatchEvent(new Event('change'));
  });
  await expect(page.getByText(/Found 5 figures/)).toBeVisible();
  const href = await page.getByRole('link', { name: 'Save PNG' }).getAttribute('href');
  expect(href).toMatch(/^data:image\/png/);
  expect(await page.getByRole('link', { name: 'Save PNG' }).getAttribute('download')).toBe('enemy-urchin.png');
  expect(errors).toEqual([]);
});
