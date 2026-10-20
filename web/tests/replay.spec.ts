import { test, expect } from '@playwright/test';

const TINY_WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
test.beforeEach(async ({ page }) => {
  await page.route(/\/ipfs\//, (route) => route.fulfill({ status: 200, contentType: 'image/webp', body: TINY_WEBP }));
});

test.describe('replay screen', () => {
  test('loads real art for both fighters from the gateways', async ({ page }) => {
    await page.goto('/replay');
    await expect(page.locator('.rp-stage img[data-art="remote"]')).toHaveCount(2, { timeout: 15_000 });
  });

  test('keeps the drawn placeholder (never a broken image) when every gateway fails', async ({ page }) => {
    await page.route(/\/ipfs\//, (route) => route.abort());
    await page.goto('/replay');
    await page.waitForTimeout(1500);
    const imgs = page.locator('.rp-stage img');
    await expect(imgs).toHaveCount(2);
    for (const state of await imgs.evaluateAll((els) => els.map((el) => ({ art: el.getAttribute('data-art'), width: (el as HTMLImageElement).naturalWidth })))) {
      expect(state.art).toBe('placeholder'); expect(state.width).toBeGreaterThan(0);
    }
  });

  test('NEXT EVENT steps one event at a time and the last events list never exceeds three rows', async ({ page }) => {
    await page.goto('/replay');
    await expect(page.locator('.rp-count')).toHaveText(/^0 \/ \d+$/);
    for (let i = 1; i <= 5; i++) {
      await page.getByRole('button', { name: 'NEXT EVENT' }).click();
      await expect(page.locator('.rp-count')).toHaveText(new RegExp(`^${i} / \\d+$`));
      expect(await page.locator('.rp-ticker li:not(.empty)').count()).toBeLessThanOrEqual(3);
    }
    await expect(page.locator('.rp-burst')).toHaveCount(1);
    await expect(page.locator('.rp-caption p')).not.toBeEmpty();
  });

  test('PLAY becomes PAUSE while playing and the fight reaches a result', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    await expect(page.getByRole('button', { name: 'PAUSE', exact: true })).toBeVisible();
    await expect(page.locator('[data-testid="final-summary"]')).toHaveAttribute('data-finished', 'true', { timeout: 50_000 });
    await expect(page.getByTestId('stage-result')).toContainText(/YOU (WON|LOST)/);
  });

  test('phone layout has no sideways scroll and the controls are at least 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/replay');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    for (const name of ['PLAY', 'NEXT EVENT', 'SKIP TO RESULT']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    }
  });

  test('no em dash and no raw hyphenated ids anywhere on the finished replay', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
    await page.locator('.rp-log summary').click();
    const text = await page.locator('main').innerText();
    expect(text).not.toContain('\u2014');
    expect(text).not.toMatch(/\b[a-z]+(?:-[a-z]+)+\b/);
  });
});

test('the result stays hidden until the fight ends, then appears', async ({ page }) => {
  await page.route(/\/ipfs\//, (route) => route.fulfill({ status: 200, contentType: 'image/webp', body: TINY_WEBP }));
  await page.goto('/replay');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'NEXT EVENT' }).click();
  const summary = page.locator('[data-testid="final-summary"]');
  await expect(summary.getByTestId('summary-pending')).toBeVisible();
  await expect(summary.getByTestId('summary-verdict')).toHaveCount(0);
  await expect(summary.getByText('Winner')).toHaveCount(0);
  await expect(summary.getByText('Final HP')).toHaveCount(0);
  await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
  await expect(summary.getByTestId('summary-verdict')).toContainText(/You (won|lost)/);
  await expect(summary.getByText('Winner')).toBeVisible();
  await expect(summary.getByTestId('summary-pending')).toHaveCount(0);
});

test.describe('game sounds', () => {
  test.beforeEach(async ({ page }) => {
    // Count the real audio nodes the page creates, so we can prove sound is requested without needing speakers.
    await page.addInitScript(() => {
      const w = window as unknown as { __audio: { nodes: number }; AudioContext: typeof AudioContext };
      w.__audio = { nodes: 0 };
      const Original = w.AudioContext;
      w.AudioContext = class extends Original {
        createOscillator() { w.__audio.nodes++; return super.createOscillator(); }
        createBufferSource() { w.__audio.nodes++; return super.createBufferSource(); }
      } as typeof AudioContext;
    });
  });
  const nodes = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __audio: { nodes: number } }).__audio.nodes);

  test('each event makes sound, and the Sound toggle mutes and unmutes it', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await expect.poll(() => nodes(page)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Sound on' }).click();
    await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
    const muted = await nodes(page);
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await page.waitForTimeout(400);
    expect(await nodes(page)).toBe(muted);
    await page.getByRole('button', { name: 'Sound off' }).click();
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await expect.poll(() => nodes(page)).toBeGreaterThan(muted);
  });

  test('PLAY begins with the start sound (a stinger made of at least 5 sounds)', async ({ page }) => {
    await page.goto('/replay');
    expect(await nodes(page)).toBe(0);
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    await expect.poll(() => nodes(page)).toBeGreaterThanOrEqual(5);
  });

  test('skipping to the result plays only the click and the win or lose jingle', async ({ page }) => {
    await page.goto('/replay');
    expect(await nodes(page)).toBe(0);
    await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
    await expect(page.getByTestId('stage-result')).toBeVisible();
    // click (1) + jingle (win 9 or lose 4); no per-event sounds are queued for the events that were skipped.
    await expect.poll(() => nodes(page)).toBeGreaterThanOrEqual(5);
    expect(await nodes(page)).toBeLessThanOrEqual(20);
  });

  // Between 0.3 and 1.0 seconds after PLAY no fight event has happened yet (the first comes at 1.4 seconds),
  // so anything created in that window is the music loop.
  test('music plays while the fight runs and stops when paused', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    await page.waitForTimeout(300);
    const a = await nodes(page);
    await page.waitForTimeout(700);
    expect((await nodes(page)) - a).toBeGreaterThanOrEqual(8);
    await page.getByRole('button', { name: 'PAUSE', exact: true }).click();
    await page.waitForTimeout(500);
    const paused = await nodes(page);
    await page.waitForTimeout(800);
    expect(await nodes(page)).toBe(paused);
  });

  test('turning Music off silences the loop but keeps the start sound', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'Music on' }).click();
    await expect(page.getByRole('button', { name: 'Music off' })).toBeVisible();
    const before = await nodes(page);
    await page.getByRole('button', { name: 'PLAY', exact: true }).click();
    await page.waitForTimeout(300);
    const a = await nodes(page);
    expect(a - before).toBeGreaterThan(0);
    await page.waitForTimeout(700);
    expect(await nodes(page)).toBe(a);
  });

  test('the Voice toggle removes the fighter voices from an event and keeps the effects', async ({ page }) => {
    const afterFirstEvent = async () => { await page.goto('/replay'); const start = await nodes(page); await page.getByRole('button', { name: 'NEXT EVENT' }).click(); await expect.poll(() => nodes(page)).toBeGreaterThan(start); await page.waitForTimeout(200); return (await nodes(page)) - start; };
    const withVoice = await afterFirstEvent();
    await page.getByRole('button', { name: 'Voice on' }).click();
    await page.reload();
    const start = await nodes(page);
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await page.waitForTimeout(300);
    const withoutVoice = (await nodes(page)) - start;
    expect(withoutVoice).toBeGreaterThan(0);
    expect(withoutVoice).toBeLessThan(withVoice);
  });

  test('a muted choice is remembered after a reload', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'Sound on' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
    const before = await nodes(page);
    await page.getByRole('button', { name: 'NEXT EVENT' }).click();
    await page.waitForTimeout(400);
    expect(await nodes(page)).toBe(before);
  });
});
