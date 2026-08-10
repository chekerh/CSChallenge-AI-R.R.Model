import { test, expect } from '@playwright/test';

test('user can sign up and land on the dashboard', async ({ page }) => {
  test.setTimeout(60_000);
  const stamp = Date.now();
  const email = `e2e+${stamp}@utopiahire.local`;
  const password = 'password123';

  await page.goto('/register');

  await page.getByLabel(/Nom/i).fill('E2E User');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe').fill(password);
  await page.getByRole('button', { name: /Créer mon compte/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 20_000,
  });
});

test('user can upload a classic CV and see it listed', async ({ page }) => {
  test.setTimeout(120_000);
  const email = process.env.E2E_ADMIN_EMAIL || 'test+e2e@utopiahire.local';
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe').fill(password);
  await page.getByRole('button', { name: /Se connecter/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole('button', { name: /Mode classique/i }).click();
  await page.getByPlaceholder(/collez ici/i).fill(
    [
      'Prenom Nom',
      'Tunis, Tunisie',
      'Email: prenom.nom@example.com',
      '',
      'Experience',
      'Developpeur full-stack, 2019-present, Acme',
      'Competences: React, Node, TypeScript',
      '',
      'Formation',
      'Master Informatique, 2019',
    ].join('\n'),
  );

  await page.getByRole('button', { name: /Analyser|Analyse/i }).first().click();
  await expect(page.getByText(/Prenom Nom/i).first()).toBeVisible({ timeout: 30_000 });
});
