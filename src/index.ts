// Core spec types
export { Spec } from "./specs/spec.js";
export {
  SpecWidth,
  SpecHeight,
  SpecAbove,
  SpecBelow,
  SpecLeftOf,
  SpecRightOf,
  SpecInside,
  SpecNear,
  SpecOn,
  SpecCentered,
  SpecAligned,
  SpecHorizontally,
  SpecVertically,
  SpecText,
  SpecCss,
  SpecOcr,
  SpecImage,
  SpecColorScheme,
  SpecVisible,
  SpecAbsent,
  SpecCount,
  SpecContains,
  SpecComponent,
  Alignment,
  CenteredLocation,
  TextCheckType,
  CountFetchType,
  ErrorRateType,
} from "./specs/specs.js";

// Range and positioning
export { Range, RangeValue, RangeType } from "./specs/range.js";
export { Side, oppositeSide, parseSide } from "./specs/side.js";
export { Location } from "./specs/location.js";
export { Place } from "./specs/place.js";

// Locator and page spec
export {
  Locator,
  LocatorType,
  CorrectionType,
} from "./specs/page/locator.js";
export type { Correction, CorrectionsRect } from "./specs/page/locator.js";
export { PageSpec } from "./specs/page/page-spec.js";
export type {
  ObjectSpecs,
  PageSection,
  SpecGroup,
} from "./specs/page/page-spec.js";

// Page abstraction
export { Rect } from "./page/rect.js";
export { Point } from "./page/point.js";
export type { PageElement } from "./page/page-element.js";
export {
  AbsentPageElement,
  ScreenElement,
  ViewportElement,
} from "./page/page-element.js";
export type { Page } from "./page/page.js";
export { PlaywrightPageAdapter } from "./page/playwright-page.js";

// Browser abstraction
export type { Browser, Size } from "./browser/browser.js";
export { PlaywrightBrowserAdapter } from "./browser/playwright-browser.js";

// Validation
export type {
  ValidationResult,
  ValidationObject,
  ValidationError,
  ValidationListener,
  LayoutMeta,
} from "./validation/validation-result.js";

// Parser
export { StructNode } from "./parser/struct-node.js";
export { IndentationStructureParser } from "./parser/indentation-structure-parser.js";
export { StringCharReader } from "./parser/string-char-reader.js";
export { SpecReader } from "./parser/spec-reader.js";
export { VarsParser } from "./parser/vars-parser.js";
export { PageSpecReader } from "./parser/page-spec-reader.js";
export type {
  SectionFilter,
  PageSpecReaderOptions,
} from "./parser/page-spec-reader.js";
export { SyntaxError as GalenSyntaxError } from "./parser/syntax-error.js";

// Validation engine
export { PageValidation } from "./validation/page-validation.js";
export { SectionValidation } from "./validation/section-validation.js";
export type { SectionValidationReport } from "./validation/section-validation.js";
export { ValidationErrorException, SpecValidation } from "./validation/spec-validation.js";
export { getValidation } from "./validation/validation-factory.js";
export { MetaBasedValidation } from "./validation/meta-based-validation.js";

// Public API
export { Galen } from "./api/galen.js";
export type { CheckLayoutOptions } from "./api/galen.js";

// Reports
export { LayoutReport, LayoutReportListener } from "./reports/layout-report.js";
export type {
  LayoutSection as ReportLayoutSection,
  LayoutObject as ReportLayoutObject,
  LayoutSpecResult,
  LayoutSpecGroup as ReportLayoutSpecGroup,
} from "./reports/layout-report.js";
export { JsonReportBuilder } from "./reports/json-report-builder.js";
export { HtmlReportBuilder } from "./reports/html-report-builder.js";
export { JunitReportBuilder } from "./reports/junit-report-builder.js";

// Image comparison
export { setImageComparator } from "./validation/specs/validation-image.js";
export type { ImageComparator, ImageCompareResult } from "./validation/specs/validation-image.js";

// Suite runner
export { PageTest } from "./suite/page-test.js";
export type { PageTestSize } from "./suite/page-test.js";
export {
  PageAction,
  PageActionOpen,
  PageActionResize,
  PageActionCheck,
  PageActionRunJavascript,
  PageActionWait,
  PageActionInjectJavascript,
} from "./suite/page-action.js";
export type { PageActionResult } from "./suite/page-action.js";
export { SuiteReader } from "./suite/suite-reader.js";
export { SuiteRunner } from "./suite/suite-runner.js";
export type {
  TestResult,
  SuiteResult,
  SuiteRunnerOptions,
} from "./suite/suite-runner.js";

// JS integration
export { createSpecJsFunctions } from "./parser/js-executor.js";
