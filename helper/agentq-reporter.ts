import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { pushTestResultToAgentQ } from './agentq-helper';

/**
 * Pushes every UI test's result to AgentQ automatically once it finishes — no
 * per-spec-file wiring needed. Registered in playwright.config.ts's `reporter` array.
 *
 * API tests (`@api`) are skipped on purpose — AgentQ tracks the QA test-case suite,
 * which the API layer re-verifies rather than owns; only the UI run reports status.
 */
export default class AgentQReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    if (test.title.includes('@api')) {
      return;
    }

    const errorDetails = result.errors.map((e) => e.message).join('; ');
    await pushTestResultToAgentQ(test.title, result.status, result.duration, errorDetails);
  }
}
