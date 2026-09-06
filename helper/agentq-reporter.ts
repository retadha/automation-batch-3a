import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { pushTestResultToAgentQ } from './agentq-helper';

/**
 * Pushes every test's result to AgentQ automatically once it finishes — no
 * per-spec-file wiring needed. Registered in playwright.config.ts's `reporter` array.
 */
export default class AgentQReporter implements Reporter {
  async onTestEnd(test: TestCase, result: TestResult) {
    const errorDetails = result.errors.map((e) => e.message).join('; ');
    await pushTestResultToAgentQ(test.title, result.status, result.duration, errorDetails);
  }
}
