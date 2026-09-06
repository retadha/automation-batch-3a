import { test, expect } from '@playwright/test';
import { SignupPage } from '../../pages/signup/SignupPage';
import users from '../../data/signup/users.json';

test('User successfully registers with valid data @signup @positive @p0 @smoke TC-REG-1', async ({
  page,
}) => {
  const signupPage = new SignupPage(page);

  // Precondition
  await signupPage.goto();
  const email = `qa.${Date.now()}@example.com`;

  // Steps
  await signupPage.signup({ ...users.valid_user, email });

  // Expected
  await expect(page).toHaveURL(/onboarding/);
  await expect(page.getByText('Please verify your email address')).toBeVisible();
});

test('User cannot register with an already registered email @signup @negative @p0 TC-REG-2', async ({
  page,
}) => {
  const signupPage = new SignupPage(page);

  // Precondition
  await signupPage.goto();

  // Steps
  await signupPage.signup({ ...users.valid_user, ...users.existing_user });

  // Expected — backend rejects the duplicate email; form resets back to the Create Account tab
  await expect(page.getByText('Create Account', { exact: true })).toBeVisible();
  await expect(signupPage.emailInput).toBeEmpty();
});

const createAccountCases = [
  {
    tc: 'TC-REG-3',
    name: 'Email field rejects invalid format',
    email: 'testexample.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    expectedMessage: 'Please enter a valid email address',
  },
  {
    tc: 'TC-REG-4',
    name: 'Email field cannot be left empty',
    email: '',
    password: 'Password123',
    confirmPassword: 'Password123',
    expectedMessage: 'Email is required',
  },
  {
    tc: 'TC-REG-5',
    name: 'Password field cannot be left empty',
    email: 'qa.user02@example.com',
    password: '',
    confirmPassword: '',
    expectedMessage: 'Password is required',
  },
  {
    tc: 'TC-REG-6',
    name: 'Password shorter than 8 characters is rejected',
    email: 'qa.user03@example.com',
    password: 'Ab1de',
    confirmPassword: 'Ab1de',
    expectedMessage: 'Password must be at least 8 characters',
  },
  {
    tc: 'TC-REG-9',
    name: 'Confirm password must match password',
    email: 'qa.user06@example.com',
    password: 'Password123',
    confirmPassword: 'Password124',
    expectedMessage: 'Passwords do not match',
  },
  {
    tc: 'TC-REG-10',
    name: 'Confirm password field cannot be left empty',
    email: 'qa.user07@example.com',
    password: 'Password123',
    confirmPassword: '',
    expectedMessage: 'Confirm Password is required',
  },
];

for (const testCase of createAccountCases) {
  test(`${testCase.name} @signup @negative @p1 ${testCase.tc}`, async ({ page }) => {
    const signupPage = new SignupPage(page);

    // Precondition
    await signupPage.goto();

    // Steps
    await signupPage.fillCreateAccount(testCase);

    // Expected
    await expect(signupPage.fieldError(testCase.expectedMessage)).toBeVisible();
    await expect(signupPage.nextButton).toBeDisabled();
  });
}

test(
  'Password longer than 50 characters is rejected @signup @negative @p1 TC-REG-7',
  async ({ page }) => {
    const signupPage = new SignupPage(page);
    const password = 'Aa1'.repeat(17); // 51 characters

    // Precondition
    await signupPage.goto();

    // Steps — a 51-character password should be rejected, but the app currently accepts it
    await signupPage.fillCreateAccount({
      email: 'qa.user04@example.com',
      password,
      confirmPassword: password,
    });

    // Expected (currently failing — known bug, see TC-REG-7)
    await expect(signupPage.nextButton).toBeDisabled();
  },
);

test(
  'Password without required character combination is rejected @signup @negative @p1 TC-REG-8',
  async ({ page }) => {
    const signupPage = new SignupPage(page);

    // Precondition
    await signupPage.goto();

    // Steps — a password missing an uppercase letter should be rejected, but the app currently accepts it
    await signupPage.fillCreateAccount({
      email: 'qa.user05@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    // Expected (currently failing — known bug, see TC-REG-8)
    await expect(signupPage.nextButton).toBeDisabled();
  },
);

test('Phone number longer than maximum digits is rejected @signup @negative @p0 TC-REG-14', async ({
  page,
}) => {
  const signupPage = new SignupPage(page);

  // Precondition — complete the Create Account tab with valid data
  await signupPage.goto();
  await signupPage.fillCreateAccount({
    email: 'qa.user12@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  await signupPage.nextButton.click();

  // Steps — Country stays on its default (Indonesia); phone number exceeds the 9-13 digit range
  await signupPage.fillUserInformation({
    fullName: 'Rumi Bootcamp',
    phoneNumber: '12345678901234',
  });
  await signupPage.nextButton.click();

  // Expected
  await expect(
    signupPage.fieldError('Please enter a valid phone number (9-13 digits)'),
  ).toBeVisible();
  await expect(signupPage.nextButton).toBeDisabled();
});
