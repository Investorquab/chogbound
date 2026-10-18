import { test, expect } from '@playwright/test';
import { installFakeWallet } from './helpers/fake-monad';

// Token 308 (CHOG #1769) has stats 36 / 49 / 54 / 50. unit/holder-traits.test.ts pins the same number against the engine,
// so if the mapping ever changes both tests fail together and the number is updated on purpose.
const TOKEN_308_STAT_TOTAL = 189;

test.describe('holder flow with a pretend wallet and a pretend Monad node', () => {
  test('a holder connects, sees exactly their Chogs, and fights with the real traits of the one they pick', async ({ page }) => {
    await installFakeWallet(page, { owns: [308, 1798] });
    await page.goto('/pick');
    await page.getByRole('button', { name: 'CONNECT WALLET' }).click();
    const owned = page.getByTestId('owned-chogs');
    await expect(owned.locator('.cast-card')).toHaveCount(2);
    await expect(owned).toContainText('CHOG #1769');
    await expect(owned).toContainText('CHOG #1290 / Krown');
    expect(await owned.innerText()).not.toContain('\u2014');
    await owned.getByRole('button', { name: 'Play with CHOG #1769' }).click();
    await expect(page).toHaveURL(/\/coach/);
    await expect(page.locator('main')).toContainText('CHOG #1769');
    await page.goto('/replay');
    await expect(page.locator('.rp-eyebrow')).toContainText('YOUR CHOG');
    await expect(page.locator('.rp-hp.a .rp-name')).toHaveText('CHOG #1769');
    await expect(page.locator('.rp-score > div').first().locator('strong')).toHaveText(String(TOKEN_308_STAT_TOTAL));
  });

  test('the holder stays connected after a reload and can disconnect', async ({ page }) => {
    await installFakeWallet(page, { owns: [1] });
    await page.goto('/pick');
    await page.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(page.getByTestId('wallet-connected')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('owned-chogs').locator('.cast-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'DISCONNECT' }).click();
    await expect(page.getByRole('button', { name: 'CONNECT WALLET' })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('wallet-connected')).toHaveCount(0);
  });

  test('a wallet with no Chogs is told so and can still play as a guest', async ({ page }) => {
    await installFakeWallet(page, { owns: [] });
    await page.goto('/pick');
    await page.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(page.getByTestId('wallet-empty')).toBeVisible();
    await expect(page.locator('.cast-card')).not.toHaveCount(0);
    await page.goto('/');
    await page.getByRole('button', { name: /RUN TONIGHT'S FIGHTS NOW/i }).click();
    await expect(page.locator('.rp-eyebrow')).toContainText('GUEST REPLAY');
  });

  test('cancelled connect, cancelled signature and a missing wallet each show a plain message', async ({ page, browser }) => {
    await installFakeWallet(page, { owns: [1], rejectConnect: true });
    await page.goto('/pick');
    await page.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(page.locator('.wallet-error')).toContainText('cancelled');
    const second = await browser.newPage();
    await installFakeWallet(second, { owns: [1], rejectSign: true });
    await second.goto('/pick');
    await second.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(second.locator('.wallet-error')).toContainText('cancelled');
    const third = await browser.newPage();
    await installFakeWallet(third, { owns: [1], noWallet: true });
    await third.goto('/pick');
    await third.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(third.locator('.wallet-error')).toContainText('No wallet found');
  });

  test('the pick page stays inside a phone screen with the wallet panel and owned Chogs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installFakeWallet(page, { owns: [308, 1798, 1] });
    await page.goto('/pick');
    await page.getByRole('button', { name: 'CONNECT WALLET' }).click();
    await expect(page.getByTestId('owned-chogs').locator('.cast-card')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    // Card text must stay inside its card (it once spilled out and overlapped the line below).
    const spills = await page.getByTestId('owned-chogs').locator('.cast-card').evaluateAll((cards) => cards.filter((card) => { const box = card.getBoundingClientRect(); return [...card.querySelectorAll('strong, span')].some((el) => el.getBoundingClientRect().bottom > box.bottom + 1); }).length);
    expect(spills).toBe(0);
  });
});
