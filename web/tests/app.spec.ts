import { test, expect } from '@playwright/test';

const routes = ['/', '/pick', '/coach', '/replay', '/arena', '/profile'];

test.describe('ChogBound guest demo quality gates', () => {
  test('every page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('header.topbar')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('document width stays at 390px on every route', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `${route} scrollWidth`).toBe(390);
    }
  });

  test('Lock Plan persists and Edit Plan unlocks it', async ({ page }) => {
    await page.goto('/coach');
    await page.getByRole('button', { name: 'LOCK PLAN' }).click();
    await expect(page.getByText('Plan locked for tonight.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'EDIT PLAN' })).toBeEnabled();
    await page.reload();
    await expect(page.getByText('Plan locked for tonight.')).toBeVisible();
    await page.getByRole('button', { name: 'EDIT PLAN' }).click();
    await expect(page.getByText('Plan ready to lock.')).toBeVisible();
  });

  test('Run tonight reaches a finished replay without a wallet in under 60 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.getByRole('button', { name: /RUN TONIGHT'S FIGHTS NOW/i }).click();
    await expect(page).toHaveURL(/\/replay(?:\?.*)?$/);
    await expect(page.locator('[data-testid="final-summary"]')).toHaveAttribute('data-finished', 'true', { timeout: 55_000 });
    expect(Date.now() - start).toBeLessThan(60_000);
  });

  test('Compare runs two real simulations with the same plan against the same rival', async ({ page }) => {
    await page.goto('/coach');
    await page.getByRole('button', { name: 'RUN BOTH' }).click();
    const results = page.locator('[data-testid="compare-results"] .compare-result');
    await expect(results).toHaveCount(2);
    await expect(results.first()).toContainText('real events');
    await expect(results.nth(1)).toContainText('real events');
  });

  test('Skip to result lands on the final summary', async ({ page }) => {
    await page.goto('/replay');
    await page.getByRole('button', { name: 'SKIP TO RESULT' }).click();
    const summary = page.locator('[data-testid="final-summary"]');
    await expect(summary).toHaveAttribute('data-finished', 'true');
    await expect(summary.getByText('Final result')).toBeVisible();
  });

  test('no route renders a standalone on-chain token ID', async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByText(/token\s*id/i)).toHaveCount(0);
      await expect(page.locator('[data-token-id], .token-id, [data-testid="token-id"]')).toHaveCount(0);
    }
  });
});
