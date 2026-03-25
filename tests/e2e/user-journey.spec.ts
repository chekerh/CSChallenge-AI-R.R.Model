import { test, expect } from '@playwright/test';

test('user can sign up', async ({ page }) => {
  test.setTimeout(45_000);
  const stamp = Date.now();
  const email = `e2e+${stamp}@utopiahire.local`;
  const password = 'password123';

  await page.goto('/');
  await page.getByRole('button', { name: /start your journey/i }).click();
  await page.getByLabel(/name/i).fill('E2E User');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 15_000,
  });
});

test('user can upload a classic CV and see it listed', async ({ page }) => {
  test.setTimeout(120_000);
  const email = process.env.E2E_ADMIN_EMAIL || 'test+e2e@utopiahire.local';
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123';

  await page.goto('/');
  await page.getByRole('textbox', { name: /email address/i }).fill(email);
  await page.getByRole('textbox', { name: /^password$/i }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('button', { name: /mode classique/i }).click();
  await page.getByPlaceholder(/collez ici/i).fill(
    [
      'Prenom Nom',
      'Tunis, Tunisie',
      'Email: prenom.nom@example.com',
      '',
      'Experience:',
      '- Support client (2023-2024): gestion tickets, satisfaction.',
    ].join('\n')
  );
  const uploadPromise = page.waitForResponse((r) => {
    return r.url().includes('/resumes/upload') && r.request().method() === 'POST';
  });
  await page.getByRole('button', { name: /envoyer/i }).click({ force: true });
  const uploadRes = await uploadPromise;
  expect(uploadRes.ok()).toBeTruthy();

  const picker = page.getByRole('combobox', { name: /ouvrir un cv existant/i });
  await expect(picker).toBeVisible({ timeout: 25_000 });
  // After upload the picker should have at least one real option besides "— Choisir —".
  await expect(picker).not.toHaveValue('— Choisir —', { timeout: 25_000 });
});

