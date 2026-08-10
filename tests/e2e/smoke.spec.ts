import { test, expect } from '@playwright/test';

test('landing page renders key sections (FR)', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: /Votre CV réécrit par l'IA/i })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('button', { name: /Commencer/i }).first().scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: /Commencer/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /Tarifs/i }).first().click();
  await expect(page.getByRole('heading', { name: /Tarifs/i })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /Se connecter/i }).first().click();
  await expect(page.getByRole('heading', { name: 'UtopiaHire' })).toBeVisible();
  await expect(page.getByPlaceholder('Adresse e-mail')).toBeVisible();
});

test('user can sign up from the landing CTA', async ({ page }) => {
  test.setTimeout(60_000);
  const stamp = Date.now();
  const email = `e2e+${stamp}@utopiahire.local`;

  await page.goto('/');
  await page.getByRole('button', { name: /Commencer/i }).first().click();

  await expect(page.getByPlaceholder('Adresse e-mail')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /Créer mon compte/i })).toBeVisible();

  await page.getByLabel(/Nom/i).fill('E2E Smoke');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe').fill('password123');
  await page.getByRole('button', { name: /Créer mon compte/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 20_000,
  });
});

test('existing user can log in and reach the dashboard', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'test+e2e@utopiahire.local';
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe').fill(password);
  await page.getByRole('button', { name: /Se connecter/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 20_000,
  });
});
