import { test, expect } from '@playwright/test';

test('super_admin can open admin dashboard and view analytics', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'test+e2e@utopiahire.local';
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

  await page.goto('/');

  await page.getByRole('textbox', { name: /email address/i }).fill(email);
  await page.getByRole('textbox', { name: /^password$/i }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('button', { name: /admin/i })).toBeVisible();
  await page.getByRole('button', { name: /^admin$/i }).click();

  await expect(page.getByRole('heading', { name: /^admin$/i })).toBeVisible();
  await page.getByRole('button', { name: /analytics/i }).click();

  await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  await expect(page.locator('pre')).toBeVisible();
});

