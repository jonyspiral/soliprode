import { test, expect } from '@playwright/test';

test('visitante en /activar-pase redirige a login con next', async ({ page }) => {
  await page.goto('/activar-pase');
  await expect(page).toHaveURL(/\/login\?next=%2Factivar-pase|\/login\?next=\/activar-pase/);
});
