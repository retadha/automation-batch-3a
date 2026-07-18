import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('Login Success Case', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Precondition
  await loginPage.goto();

  // Steps
  await loginPage.login('testingemrachat@gmail.com', 'tester!3');

  // Expected
  await expect(loginPage.userMenuButton('Fadhli Maulidri Baru')).toBeVisible();
});

test('Login Failure Case - Invalid Password', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Precondition
  await loginPage.goto();

  // Steps
  await loginPage.login('testingemrachat@gmail.com', 'wrongPassword123');

  // Expected
  await expect(page).toHaveURL(/login/);
  await expect(loginPage.signInButton).toBeVisible();
});
