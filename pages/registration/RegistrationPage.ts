import { Page, Locator } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;
  // Step 1: Create Account (Email, Password)
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Step 2: User Information
  readonly fullNameInput: Locator;
  readonly countryCombobox: Locator;
  readonly phoneNumberInput: Locator;

  // Step 3: Company Information
  readonly companyNameInput: Locator;
  readonly industrySelect: Locator;
  readonly companySizeSelect: Locator;
  readonly createAccountButton: Locator;

  // Shared across steps — only one is ever rendered at a time
  readonly nextButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm Password' });

    this.fullNameInput = page.getByRole('textbox', { name: 'Full Name' });
    this.countryCombobox = page.getByRole('combobox').filter({ hasText: /\(\+\d+\)/ });
    this.phoneNumberInput = page.getByRole('textbox', { name: 'Phone Number' });

    this.companyNameInput = page.getByRole('textbox', { name: 'Company Name' });
    this.industrySelect = page.getByLabel('Industry');
    this.companySizeSelect = page.getByLabel('Company Size');
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' });

    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.backButton = page.getByRole('button', { name: 'Back' });
  }

  async goto() {
    await this.page.goto('https://www.emra.chat/signup');
  }

  /**
   * Fills a field and blurs it. When the target value is empty, first types a
   * throwaway character and clears it — filling an already-empty field with ''
   * is a no-op from React's perspective (no change event fires), so a
   * "required" message would never appear on an untouched field otherwise.
   */
  private async setFieldValue(locator: Locator, value: string) {
    if (value === '') {
      await locator.fill('x');
    }
    await locator.fill(value);
    await locator.blur();
  }

  /** Fills the Create Account tab without submitting. */
  async fillCreateAccount({
    email,
    password,
    confirmPassword,
  }: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.setFieldValue(this.emailInput, email);
    await this.setFieldValue(this.passwordInput, password);
    await this.setFieldValue(this.confirmPasswordInput, confirmPassword);
  }

  /** Fills the User Information tab without submitting. Country keeps its default (Indonesia) unless changed. */
  async fillUserInformation({ fullName, phoneNumber }: { fullName: string; phoneNumber: string }) {
    await this.fullNameInput.fill(fullName);
    await this.phoneNumberInput.fill(phoneNumber);
  }

  /** Fills the Company Information tab without submitting. */
  async fillCompanyInformation({
    companyName,
    industry,
    companySize,
  }: {
    companyName: string;
    industry: string;
    companySize: string;
  }) {
    await this.companyNameInput.fill(companyName);
    await this.industrySelect.selectOption(industry);
    await this.companySizeSelect.selectOption(companySize);
  }

  /** Returns the locator for a validation message shown on the current step. */
  fieldError(message: string): Locator {
    return this.page.getByText(message, { exact: true });
  }

  /** Convenience: complete the full 3-step registration with valid data. */
  async register({
    email,
    password,
    fullName,
    phoneNumber,
    companyName,
    industry,
    companySize,
  }: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    companyName: string;
    industry: string;
    companySize: string;
  }) {
    await this.fillCreateAccount({ email, password, confirmPassword: password });
    await this.nextButton.click();

    await this.fillUserInformation({ fullName, phoneNumber });
    await this.nextButton.click();

    await this.fillCompanyInformation({ companyName, industry, companySize });
    await this.createAccountButton.click();
  }
}
