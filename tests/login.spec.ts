import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import userData from '../data/user.json'

test.fail('Login Success Case @login @positive @p0 @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Precondition
  await loginPage.goto();

  const email = userData['regular_user']['email'];
  const password = userData['regular_user']['password'];
  // Steps
  await loginPage.login(email, password);

  // Expected
  await expect(loginPage.userMenuButton('Fadhli Maulidri Baru')).toBeVisible();
});

test('Login Failure Case - Invalid Password @login  @negative @p1', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Precondition
  await loginPage.goto();

  // Steps
  await loginPage.login('testingemrachat@', 'wrongPassword123');

  // Expected
  await expect(page).toHaveURL(/login/);
  await expect(loginPage.signInButton).toBeVisible();
});
