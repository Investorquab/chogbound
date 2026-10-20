import { test, expect } from '@playwright/test';

const TINY_WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
test.beforeEach(async ({ page }) => { await page.route(/\/ipfs\//, (route) => route.fulfill({ status: 200, contentType: 'image/webp', body: TINY_WEBP })); });

test.describe('big PLAY button', () => {
  test('is on screen on a phone as soon as you choose a Chog, and starts that Chog fighting', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pick');
    const card = page.locator('.cast-grid').first().locator('.cast-card').nth(5);
    const chosen = (await card.locator('strong').innerText()).trim();
    await card.click();
    const bar = page.getByTestId('play-bar');
    await expect(bar).toBeVisible(); await expect(bar).toContainText(chosen);
    const play = bar.getByRole('button', { name: 'PLAY', exact: true });
    const box = await play.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56); expect(box!.y + box!.height).toBeLessThanOrEqual(844); expect(box!.width).toBeGreaterThanOrEqual(80);
    await play.click();
    await expect(page).toHaveURL(/\/replay/);
    await expect(page.locator('.rp-eyebrow')).toContainText('GUEST REPLAY');
    await expect(page.locator('.rp-hp.a .rp-name')).toHaveText(chosen);
  });

  test('stays visible while scrolling and never covers the last Chog card', async ({ page }) => {
    await page.goto('/pick');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('play-bar')).toBeInViewport();
    const lastCard = await page.locator('.cast-grid').first().locator('.cast-card').last().boundingBox();
    const bar = await page.getByTestId('play-bar').boundingBox();
    expect(lastCard!.y + lastCard!.height).toBeLessThanOrEqual(bar!.y + 1);
  });

  test('has a COACH FIRST link on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/pick');
    await page.getByTestId('play-bar').getByRole('link', { name: 'COACH FIRST' }).click();
    await expect(page).toHaveURL(/\/coach/);
  });

  test('the coach page can start the fight with the plan you set', async ({ page }) => {
    await page.goto('/coach');
    await page.getByRole('button', { name: /^Wild/ }).first().click();
    await page.getByRole('button', { name: "PLAY TONIGHT'S FIGHT" }).click();
    await expect(page).toHaveURL(/\/replay/);
    await expect(page.locator('.rp-plans .a')).toContainText('WILD');
  });
});
