import { test, expect } from '@playwright/test';

test('super_admin can open admin dashboard and view monitoring', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'test+e2e@utopiahire.local';
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe').fill(password);
  await page.getByRole('button', { name: /Se connecter/i }).click();

  await expect(page.getByRole('button', { name: /Administration/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /Administration/i }).click();

  await expect(page.getByRole('button', { name: /Monitoring/i })).toBeVisible();
  await page.getByRole('button', { name: /Monitoring/i }).click();

  await expect(page.getByText(/Auto-réparation/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Lancer l'auto-réparation/i })).toBeVisible();
});
