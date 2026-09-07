import axios, { AxiosError } from 'axios';

interface TestResultPayload {
  status: string;
  actualResult: string;
  executionTime: number;
  notes: string;
}

const AGENTQ_API_URL = process.env.AGENTQ_API_URL || 'https://backend-app.agentq.id';
const AGENTQ_PROJECT_ID = process.env.AGENTQ_PROJECT_ID;
const AGENTQ_TESTRUN_ID = process.env.AGENTQ_TESTRUN_ID;
const AGENTQ_EMAIL = process.env.AGENTQ_EMAIL;
const AGENTQ_PASSWORD = process.env.AGENTQ_PASSWORD;

let accessToken: string;

async function getAccessToken(): Promise<string> {
  if (accessToken) {
    return accessToken;
  }
  try {
    console.log('🔐 Authenticating to AgentQ...');
    const response = await axios.post(
      `${AGENTQ_API_URL}/auth/login`,
      {
        email: AGENTQ_EMAIL,
        password: AGENTQ_PASSWORD,
      },
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );
    accessToken = response.data.access_token;
    console.log('✅ AgentQ authentication successful');
    return accessToken;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      '❌ AgentQ authentication failed:',
      axiosError.response?.data || axiosError.message,
    );
    throw error;
  }
}

async function exportTestResult(tcId: string, result: TestResultPayload) {
  const token = await getAccessToken();
  const apiUrl = `${AGENTQ_API_URL}/projects/${AGENTQ_PROJECT_ID}/test-runs/${AGENTQ_TESTRUN_ID}/test-results/tcId/${tcId}`;

  try {
    console.log(`📤 Pushing result for TC-REG-${tcId}...`);
    const response = await axios.patch(apiUrl, result, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`✅ TC-REG-${tcId} updated successfully`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      console.log(
        `⚠️ TC-REG-${tcId} not found in AgentQ test run. Test case may need to be created first.`,
      );
    } else {
      console.error(
        `❌ Failed to push TC-REG-${tcId}:`,
        axiosError.response?.data || axiosError.message,
      );
    }
    // Don't throw error - allow test to continue
  }
}

/**
 * Pushes a test's result to AgentQ. The test case ID is read from a `TC-REG-<n>`
 * tag anywhere in the title (e.g. "TC-REG-6: Password shorter than 8 characters is rejected @signup @p1"),
 * matching this repo's tagging convention.
 */
export async function pushTestResultToAgentQ(
  testTitle: string,
  status: string,
  executionTime: number,
  errorDetails?: string,
) {
  if (!AGENTQ_TESTRUN_ID) {
    console.log('⚠️ AGENTQ_TESTRUN_ID not set, skipping AgentQ update');
    return;
  }

  const match = testTitle.match(/TC-REG-(\d+)/);
  if (!match) {
    console.log(`⚠️ No TC-REG-<n> tag found in title: "${testTitle}"`);
    return;
  }

  const tcId = match[1];
  const isPassed = status === 'passed';

  await exportTestResult(tcId, {
    status: status,
    actualResult: isPassed ? `Test "${testTitle}" passed successfully` : `Test status: ${status}`,
    executionTime: executionTime / 1000, // convert to seconds
    notes: isPassed
      ? 'Test completed without errors'
      : errorDetails || `Test failed with status: ${status}`,
  });
}
