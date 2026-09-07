import { APIResponse, TestInfo } from '@playwright/test';

/**
 * Attaches the URL, request payload, status, and response body to the test's
 * HTML report — unredacted, so the exact values sent/received stand as
 * evidence — and returns the parsed response body so the caller doesn't need
 * to parse it again.
 */
export async function attachApiCall<TResponseBody = unknown>(
  testInfo: TestInfo,
  name: string,
  { url, requestBody, response }: { url: string; requestBody: unknown; response: APIResponse },
): Promise<TResponseBody> {
  const responseBody = await response.json().catch(() => null);

  await testInfo.attach(name, {
    body: JSON.stringify(
      {
        call: {
          url,
          method: 'POST',
          payload: requestBody,
        },
        response: {
          status: response.status(),
          body: responseBody,
        },
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });

  return responseBody;
}
