import type { Page as PlaywrightPage } from "playwright";
import { Page } from "../page/page.js";
import { PlaywrightPageAdapter } from "../page/playwright-page.js";
import { PageSpec } from "../specs/page/page-spec.js";
import { PageSpecReader } from "../parser/page-spec-reader.js";
import type { SectionFilter, PageSpecReaderOptions } from "../parser/page-spec-reader.js";
import { PageValidation } from "../validation/page-validation.js";
import { SectionValidation } from "../validation/section-validation.js";
import type { ValidationListener } from "../validation/validation-result.js";
import { LayoutReport, LayoutReportListener } from "../reports/layout-report.js";
import { CombinedValidationListener } from "../reports/combined-listener.js";

export interface CheckLayoutOptions {
  sectionFilter?: SectionFilter;
  properties?: Record<string, string>;
  variables?: Record<string, unknown>;
  screenshot?: Buffer;
  listener?: ValidationListener;
}

export class Galen {
  /**
   * Check layout of a Playwright page against a .gspec file.
   */
  static async checkLayout(
    page: PlaywrightPage,
    specPath: string,
    options?: CheckLayoutOptions,
  ): Promise<LayoutReport>;

  /**
   * Check layout of a Playwright page against a PageSpec object.
   */
  static async checkLayout(
    page: PlaywrightPage,
    spec: PageSpec,
    options?: CheckLayoutOptions,
  ): Promise<LayoutReport>;

  /**
   * Check layout using the Page abstraction against a .gspec file.
   */
  static async checkLayout(
    page: Page,
    specPath: string,
    options?: CheckLayoutOptions,
  ): Promise<LayoutReport>;

  /**
   * Check layout using the Page abstraction against a PageSpec.
   */
  static async checkLayout(
    page: Page,
    spec: PageSpec,
    options?: CheckLayoutOptions,
  ): Promise<LayoutReport>;

  static async checkLayout(
    pageOrPlaywright: Page | PlaywrightPage,
    specOrPath: string | PageSpec,
    options: CheckLayoutOptions = {},
  ): Promise<LayoutReport> {
    // Resolve page
    const page = isPlaywrightPage(pageOrPlaywright)
      ? new PlaywrightPageAdapter(pageOrPlaywright)
      : pageOrPlaywright;

    // Resolve spec
    let pageSpec: PageSpec;
    if (typeof specOrPath === "string") {
      const reader = new PageSpecReader();
      const readerOptions: PageSpecReaderOptions = {
        page,
        sectionFilter: options.sectionFilter,
        properties: options.properties,
        variables: options.variables,
      };
      pageSpec = reader.readFile(specOrPath, readerOptions);
    } else {
      pageSpec = specOrPath;
    }

    // Build listener chain
    const reportListener = new LayoutReportListener();
    const listeners: ValidationListener[] = [reportListener];
    if (options.listener) {
      listeners.push(options.listener);
    }
    const combinedListener = new CombinedValidationListener(listeners);

    // Run validation
    const pageValidation = new PageValidation(
      page,
      pageSpec,
      combinedListener,
    );
    const sectionValidation = new SectionValidation(
      pageValidation,
      pageSpec,
      combinedListener,
    );

    await sectionValidation.check();

    // Build report
    const report = reportListener.buildReport();

    // Attach screenshot if provided
    if (options.screenshot) {
      report.screenshot = options.screenshot;
    }

    // Attach filter tags
    if (options.sectionFilter) {
      report.includedTags = options.sectionFilter.includedTags;
      report.excludedTags = options.sectionFilter.excludedTags;
    }

    return report;
  }

  /**
   * Parse a .gspec file into a PageSpec without running validation.
   */
  static readSpec(
    specPath: string,
    options: PageSpecReaderOptions = {},
  ): PageSpec {
    const reader = new PageSpecReader();
    return reader.readFile(specPath, options);
  }

  /**
   * Parse .gspec text inline.
   */
  static readSpecFromText(
    text: string,
    options: PageSpecReaderOptions = {},
  ): PageSpec {
    const reader = new PageSpecReader();
    return reader.read(text, "<inline>", options);
  }
}

function isPlaywrightPage(page: unknown): page is PlaywrightPage {
  return (
    page !== null &&
    typeof page === "object" &&
    "goto" in page &&
    "locator" in page &&
    "viewportSize" in page
  );
}
