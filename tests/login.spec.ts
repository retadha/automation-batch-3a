import { test, expect } from '@playwright/test';

test('Login Success Case', async ({ page }) => {

  // Precondition  
  await page.goto('https://www.emra.chat/login');

  //Steps
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('testingemrachat@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('tester!3');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Expected
  await expect(page.getByRole('button', { name: 'Fadhli Maulidri Baru' })).toBeVisible();
});