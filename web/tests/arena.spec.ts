import { test, expect } from '@playwright/test';

const TINY_WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
test.beforeEach(async ({ page }) => { await page.route(/\/ipfs\//, (route) => route.fulfill({ status: 200, contentType: 'image/webp', body: TINY_WEBP })); });

test.describe('nightly system', () => {
  test('the arena shows real top 10 standings out of 1,969, your rank, tonight rival and a countdown', async ({ page }) => {
    await page.goto('/arena');
    const rows = page.getByTestId('standings-top').locator('li');
    await expect(rows).toHaveCount(10, { timeout: 20_000 });
    await expect(page.locator('.board .rank')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    await expect(page.getByText('TOP 10 OF 1,969')).toBeVisible();
    await expect(page.getByTestId('your-standing')).toContainText(/ranked [\d,]+ of 1,969/);
    await expect(page.getByTestId('tonight-rival')).toContainText('drawn by the night');
    await expect(page.getByTestId('night-clock')).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('the night number follows the date, not a fixed value', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-20T10:00:00Z'));
    await page.goto('/arena');
    await expect(page.locator('.section-head .eyebrow')).toContainText('NIGHT 12 / SEASON STANDINGS');
    await expect(page.locator('footer')).toContainText('CHOGBOUND / NIGHT 12');
  });

  test('the standings API is reproducible and rejects bad input', async ({ request }) => {
    const a = await (await request.get('/api/standings?night=4&limit=5&token=308')).json();
    const b = await (await request.get('/api/standings?night=4&limit=5&token=308')).json();
    expect(a).toEqual(b); expect(a.total).toBe(1969); expect(a.top).toHaveLength(5); expect(a.you.id).toBe(308);
    for (const q of ['?night=0', '?night=abc', '?night=9999', '?limit=0', '?limit=51', '?token=0', '?token=1970']) expect((await request.get('/api/standings' + q)).status(), q).toBe(400);
  });

  test('tonight is the same fight every time for the same Chog and night, with a rival from the whole collection', async ({ page }) => {
    const play = async () => {
      await page.goto('/');
      await page.getByRole('button', { name: /RUN TONIGHT'S FIGHTS NOW/i }).click();
      await page.waitForURL(/replay/);
      await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
      return { rival: await page.locator('.rp-hp.b .rp-name').innerText(), verdict: await page.getByTestId('summary-verdict').innerText(), events: await page.locator('.rp-count').innerText() };
    };
    const first = await play();
    await page.evaluate(() => localStorage.clear());
    const second = await play();
    expect(second).toEqual(first);
    expect(first.rival).toMatch(/^CHOG #\d+/);
  });

  test('a guest can still play when the Chog traits route is down', async ({ page }) => {
    await page.route('**/api/chogs**', (route) => route.abort());
    await page.goto('/');
    await page.getByRole('button', { name: /RUN TONIGHT'S FIGHTS NOW/i }).click();
    await page.waitForURL(/replay/);
    await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
    await expect(page.getByTestId('summary-verdict')).toContainText(/You (won|lost)/);
  });

  test('the standings failure shows a retry instead of a blank page', async ({ page }) => {
    await page.route('**/api/standings**', (route) => route.fulfill({ status: 500, body: 'no' }));
    await page.goto('/arena');
    await expect(page.getByText('The standings could not load.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'TRY AGAIN' })).toBeVisible();
  });
});
