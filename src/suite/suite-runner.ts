import type { Browser, BrowserContext, Page as PlaywrightPage } from "playwright";
import { PageTest } from "./page-test.js";
import { PageActionResult } from "./page-action.js";
import { LayoutReport } from "../reports/layout-report.js";

export interface TestResult {
  test: PageTest;
  actionResults: PageActionResult[];
  layoutReports: LayoutReport[];
  error?: string;
  startedAt: Date;
  endedAt: Date;
}

export interface SuiteResult {
  tests: TestResult[];
  totalErrors: number;
  totalWarnings: number;
  totalPassed: number;
  duration: number;
}

export interface SuiteRunnerOptions {
  browser: Browser;
  /** Run tests in parallel (default: false) */
  parallel?: boolean;
  /** Max parallel tests (default: 1) */
  concurrency?: number;
  /** Filter by group names */
  groups?: string[];
  /** Callback after each test */
  onTestComplete?: (result: TestResult) => void;
}

export class SuiteRunner {
  async run(
    tests: PageTest[],
    options: SuiteRunnerOptions,
  ): Promise<SuiteResult> {
    const startTime = Date.now();
    const filteredTests = this.filterTests(tests, options);

    let results: TestResult[];

    if (options.parallel && (options.concurrency ?? 1) > 1) {
      results = await this.runParallel(
        filteredTests,
        options,
      );
    } else {
      results = await this.runSequential(filteredTests, options);
    }

    let totalErrors = 0;
    let totalWarnings = 0;
    let totalPassed = 0;

    for (const result of results) {
      for (const report of result.layoutReports) {
        totalErrors += report.errors;
        totalWarnings += report.warnings;
        totalPassed += report.passed;
      }
      if (result.error) totalErrors++;
    }

    return {
      tests: results,
      totalErrors,
      totalWarnings,
      totalPassed,
      duration: Date.now() - startTime,
    };
  }

  private filterTests(
    tests: PageTest[],
    options: SuiteRunnerOptions,
  ): PageTest[] {
    let filtered = tests.filter((t) => !t.disabled);

    if (options.groups && options.groups.length > 0) {
      filtered = filtered.filter((t) =>
        t.groups.some((g) => options.groups!.includes(g)),
      );
    }

    return filtered;
  }

  private async runSequential(
    tests: PageTest[],
    options: SuiteRunnerOptions,
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await this.runTest(test, options.browser);
      results.push(result);
      options.onTestComplete?.(result);
    }

    return results;
  }

  private async runParallel(
    tests: PageTest[],
    options: SuiteRunnerOptions,
  ): Promise<TestResult[]> {
    const concurrency = options.concurrency ?? 4;
    const results: TestResult[] = [];
    const queue = [...tests];

    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const test = queue.shift()!;
        const result = await this.runTest(test, options.browser);
        results.push(result);
        options.onTestComplete?.(result);
      }
    });

    await Promise.all(workers);
    return results;
  }

  private async runTest(
    test: PageTest,
    browser: Browser,
  ): Promise<TestResult> {
    const startedAt = new Date();
    const actionResults: PageActionResult[] = [];
    const layoutReports: LayoutReport[] = [];
    let error: string | undefined;

    let context: BrowserContext | null = null;
    let page: PlaywrightPage | null = null;

    try {
      context = await browser.newContext();
      page = await context.newPage();

      // Set initial viewport size
      if (test.size) {
        await page.setViewportSize(test.size);
      }

      // Navigate to URL
      if (test.url) {
        await page.goto(test.url);
      }

      // Execute actions
      for (const action of test.actions) {
        try {
          const result = await action.execute(page);
          actionResults.push(result);
          if (result.layoutReport) {
            layoutReports.push(result.layoutReport);
          }
        } catch (e) {
          actionResults.push({
            action: action.originalCommand,
            error: e instanceof Error ? e.message : String(e),
          });
          error = e instanceof Error ? e.message : String(e);
          break;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      if (context) {
        await context.close();
      }
    }

    return {
      test,
      actionResults,
      layoutReports,
      error,
      startedAt,
      endedAt: new Date(),
    };
  }
}
