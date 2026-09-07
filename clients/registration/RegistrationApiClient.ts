import { APIRequestContext, APIResponse } from '@playwright/test';

const BASE_URL = 'https://api.emra.chat/api/v1';

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  password: string;
  passwordConfirmation: string;
}

export interface RegisterCompanyRequest {
  accessToken: string;
  name: string;
  companySize: string;
  industry: string;
  country: string;
}

/** What was actually sent and received — enough for a test to attach as reporting evidence. */
export interface ApiCallResult<TRequestBody> {
  url: string;
  requestBody: TRequestBody;
  response: APIResponse;
}

export interface RegisterSuccessResponse {
  success: true;
  data: {
    user: { id: number; email: string; name: string; [key: string]: unknown };
    tokens: {
      access_token: string;
      refresh_token: string;
      expires_at: string;
      refresh_expires_at: string;
    };
  };
  message: string;
}

export interface RegisterErrorResponse {
  success: false;
  errors: string[];
  error_code: string;
}

export interface CompanyRegisterSuccessResponse {
  success: true;
  data: {
    company: Record<string, unknown>;
    user_company: Record<string, unknown>;
  };
  message: string;
}

/** Wraps the registration-related endpoints. Holds no assertions — same rule as a page object. */
export class RegistrationApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async register({
    name,
    email,
    phone,
    countryCode,
    country,
    password,
    passwordConfirmation,
  }: RegisterRequest): Promise<ApiCallResult<Record<string, string>>> {
    const url = `${BASE_URL}/auth/register`;
    const requestBody = {
      name,
      email,
      phone,
      country_code: countryCode,
      country,
      password,
      password_confirmation: passwordConfirmation,
    };
    const response = await this.request.post(url, { data: requestBody });
    return { url, requestBody, response };
  }

  async registerCompany({
    accessToken,
    name,
    companySize,
    industry,
    country,
  }: RegisterCompanyRequest): Promise<ApiCallResult<{ company: Record<string, string> }>> {
    const url = `${BASE_URL}/company/register`;
    const requestBody = {
      company: {
        name,
        company_size: companySize,
        industry,
        country,
      },
    };
    const response = await this.request.post(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: requestBody,
    });
    return { url, requestBody, response };
  }
}
