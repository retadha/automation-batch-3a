import { test, expect } from '@playwright/test';
import {
  RegistrationApiClient,
  RegisterSuccessResponse,
  RegisterErrorResponse,
  CompanyRegisterSuccessResponse,
} from '../../../clients/registration/RegistrationApiClient';
import { generateValidRegisterPayload } from '../../../data/registration/generateData';
import { attachApiCall } from '../../../helper/attachApiCall';
import users from '../../../data/registration/users.json';

test('TC-REG-1: User successfully registers with valid data @api @registration @positive @p0', async ({
  request,
}, testInfo) => {
  const client = new RegistrationApiClient(request);

  // Precondition
  const payload = generateValidRegisterPayload();

  // Steps
  const register = await client.register(payload);
  const registerBody = await attachApiCall<RegisterSuccessResponse>(
    testInfo,
    'Register call',
    register,
  );

  // Expected
  expect(register.response.status()).toBe(201);
  expect(registerBody.success).toBe(true);
  expect(registerBody.data.user.email).toBe(payload.email);
  expect(registerBody.data.tokens.access_token).toBeTruthy();
  expect(registerBody.message).toBe('Please verify your email address to continue.');

  // Steps — the UI also registers the company right after registration, using the token just issued
  const registerCompany = await client.registerCompany({
    accessToken: registerBody.data.tokens.access_token,
    name: 'API Exploration Co',
    companySize: '11-50',
    industry: 'saas',
    country: payload.country,
  });
  const companyBody = await attachApiCall<CompanyRegisterSuccessResponse>(
    testInfo,
    'Company register call',
    registerCompany,
  );

  // Expected
  expect(registerCompany.response.status()).toBe(201);
  expect(companyBody.success).toBe(true);
  expect(companyBody.message).toBe('Company registered successfully');
});

test('TC-REG-2: User cannot register with an already registered email @api @registration @negative @p0', async ({
  request,
}, testInfo) => {
  const client = new RegistrationApiClient(request);

  // Precondition
  const payload = { ...generateValidRegisterPayload(), email: users.existing_user.email };

  // Steps
  const register = await client.register(payload);
  const body = await attachApiCall<RegisterErrorResponse>(testInfo, 'Register call', register);

  // Expected
  expect(register.response.status()).toBe(422);
  expect(body.success).toBe(false);
  expect(body.errors).toContain('Email has already been taken');
  expect(body.error_code).toBe('REGISTRATION_FAILED');
});

interface RegisterValidationCase {
  tc: string;
  name: string;
  overrides: Partial<Parameters<RegistrationApiClient['register']>[0]>;
  /** Omit for cases where the backend currently accepts the input (see comment) — nothing to assert an error message against. */
  expectedError?: string;
}

const registerValidationCases: RegisterValidationCase[] = [
  {
    tc: 'TC-REG-4',
    name: 'Email field cannot be left empty',
    overrides: { email: '' },
    expectedError: "Email can't be blank",
  },
  {
    tc: 'TC-REG-5',
    name: 'Password field cannot be left empty',
    overrides: { password: '', passwordConfirmation: '' },
    expectedError: "Password can't be blank",
  },
  {
    tc: 'TC-REG-9',
    name: 'Confirm password must match password',
    overrides: { passwordConfirmation: 'Password124' },
    expectedError: "Password confirmation doesn't match Password",
  },
  {
    tc: 'TC-REG-10',
    name: 'Confirm password field cannot be left empty',
    overrides: { passwordConfirmation: '' },
    expectedError: "Password confirmation can't be blank",
  },
  {
    tc: 'TC-REG-14',
    name: 'Phone number longer than maximum digits is rejected',
    overrides: { phone: '+6212345678901234' }, // 14-digit local part
    expectedError: 'Phone number must be a valid phone number in E.164 format (e.g., +1234567890)',
  },
];

for (const testCase of registerValidationCases) {
  test(`${testCase.tc}: ${testCase.name} @api @registration @negative @p1`, async ({
    request,
  }, testInfo) => {
    const client = new RegistrationApiClient(request);

    // Precondition
    const payload = { ...generateValidRegisterPayload(), ...testCase.overrides };

    // Steps
    const register = await client.register(payload);
    const body = await attachApiCall<RegisterErrorResponse>(testInfo, 'Register call', register);

    // Expected
    expect(register.response.status()).toBe(422);
    expect(body.errors).toContain(testCase.expectedError);
  });
}

// The backend does not currently enforce the documented password policy or email format at all —
// only "not blank" and "confirmation matches" are validated (see registerValidationCases above).
// These three mirror the equivalent UI bugs (TC-REG-7, TC-REG-8) one layer deeper: the API itself
// accepts input the PRD explicitly says must be rejected, not just the client-side form.
const backendValidationGaps: RegisterValidationCase[] = [
  {
    tc: 'TC-REG-3',
    name: 'Email field rejects invalid format',
    // Must stay unique per run — a fixed literal would eventually get registered by this very
    // test (since the backend currently accepts it) and start hitting the duplicate-email check
    // (also a 422) instead of actually re-testing format validation.
    overrides: { email: `not-an-email-${Date.now()}` },
  },
  {
    tc: 'TC-REG-6',
    name: 'Password shorter than 8 characters is rejected',
    overrides: { password: 'Ab1de', passwordConfirmation: 'Ab1de' },
  },
  {
    tc: 'TC-REG-7',
    name: 'Password longer than 50 characters is rejected',
    overrides: { password: 'Aa1'.repeat(17), passwordConfirmation: 'Aa1'.repeat(17) }, // 51 characters
  },
  {
    tc: 'TC-REG-8',
    name: 'Password without required character combination is rejected',
    overrides: { password: 'password123', passwordConfirmation: 'password123' },
  },
];

for (const testCase of backendValidationGaps) {
  test(`${testCase.tc}: ${testCase.name} @api @registration @negative @p1`, async ({
    request,
  }, testInfo) => {
    const client = new RegistrationApiClient(request);

    // Precondition
    const payload = { ...generateValidRegisterPayload(), ...testCase.overrides };

    // Steps
    const register = await client.register(payload);
    await attachApiCall<RegisterErrorResponse>(testInfo, 'Register call', register);

    // Expected (currently failing — known backend validation gap, see comment above)
    expect(register.response.status()).toBe(422);
  });
}
