import { faker } from '@faker-js/faker';
import options from './options.json';

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  companyName: string;
  industry: string;
  companySize: string;
}

function randomFrom<T>(list: T[]): T {
  return faker.helpers.arrayElement(list);
}

/** A fresh, always-unique valid email — safe to register with each run. */
export function generateEmail(): string {
  return faker.internet
    .email({
      firstName: faker.person.firstName(),
      lastName: `${faker.person.lastName()}${Date.now()}`,
    })
    .toLowerCase();
}

/** A password guaranteed to satisfy the app's policy (8-50 chars, upper + lower + digit). */
export function generatePassword(): string {
  const upper = faker.string.alpha({ length: 1, casing: 'upper' });
  const lower = faker.string.alpha({ length: 6, casing: 'lower' });
  const digits = faker.string.numeric(2);
  return `${upper}${lower}${digits}`;
}

export function generateFullName(): string {
  return faker.person.fullName();
}

/** A local phone number within the app's accepted 9-13 digit range, first digit 1-9. */
export function generatePhoneNumber(): string {
  const length = faker.number.int({ min: 9, max: 13 });
  const firstDigit = faker.number.int({ min: 1, max: 9 }).toString();
  const rest = faker.string.numeric(length - 1);
  return `${firstDigit}${rest}`;
}

export function generateCompanyName(): string {
  return faker.company.name();
}

/** Randomly picks one of the real Industry dropdown options recorded in options.json. */
export function randomIndustry(): string {
  return randomFrom(options.industry);
}

/** Randomly picks one of the real Company Size dropdown options recorded in options.json. */
export function randomCompanySize(): string {
  return randomFrom(options.company_size);
}

/** A complete, valid registration payload — every field is either faker-generated or randomly picked from a recorded option list. */
export function generateValidUser(): RegistrationData {
  return {
    email: generateEmail(),
    password: generatePassword(),
    fullName: generateFullName(),
    phoneNumber: generatePhoneNumber(),
    companyName: generateCompanyName(),
    industry: randomIndustry(),
    companySize: randomCompanySize(),
  };
}

export interface RegisterApiPayload {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * A valid POST /auth/register payload, shaped exactly as the API expects it
 * (captured via Playwright MCP network inspection) — full E.164 phone, ISO
 * country code, no UI-only fields. Country is fixed to Indonesia (+62/"ID"),
 * matching the app's default and every other fixture in this project.
 */
export function generateValidRegisterPayload(): RegisterApiPayload {
  const password = generatePassword();
  return {
    name: generateFullName(),
    email: generateEmail(),
    phone: `+62${generatePhoneNumber()}`,
    countryCode: '62',
    country: 'ID',
    password,
    passwordConfirmation: password,
  };
}
