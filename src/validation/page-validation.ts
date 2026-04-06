import { Spec } from "../specs/spec.js";
import { Range } from "../specs/range.js";
import { Page } from "../page/page.js";
import { PageElement } from "../page/page-element.js";
import { AbsentPageElement } from "../page/page-element.js";
import { PageSpec } from "../specs/page/page-spec.js";
import { Locator } from "../specs/page/locator.js";
import type {
  ValidationResult,
  ValidationListener,
} from "./validation-result.js";
import { ValidationErrorException } from "./spec-validation.js";
import { getValidation } from "./validation-factory.js";

export class PageValidation {
  private readonly elementCache = new Map<string, PageElement>();

  constructor(
    private readonly page: Page,
    private readonly pageSpec: PageSpec,
    private readonly listener?: ValidationListener,
  ) {}

  async check(
    objectName: string,
    spec: Spec,
  ): Promise<ValidationResult> {
    this.listener?.onBeforeObjectValidation(objectName, spec);

    let result: ValidationResult;
    try {
      const validation = getValidation(spec);
      result = await validation.check(this, objectName, spec);

      if (spec.onlyWarn && result.error) {
        result.warnings = result.error.messages;
        result.error = undefined;
      }
    } catch (e) {
      if (e instanceof ValidationErrorException) {
        result = e.asValidationResult(spec);
        if (spec.onlyWarn) {
          result.warnings = result.error?.messages ?? [];
          result.error = undefined;
        }
      } else {
        result = {
          spec,
          objects: [],
          error: {
            messages: [e instanceof Error ? e.message : String(e)],
          },
          meta: [],
          warnings: [],
        };
      }
    }

    this.listener?.onAfterObjectValidation(objectName, spec, result);
    return result;
  }

  async findPageElement(objectName: string): Promise<PageElement> {
    if (this.elementCache.has(objectName)) {
      return this.elementCache.get(objectName)!;
    }

    // Try special objects first
    const special = await this.page.getSpecialObject(objectName);
    if (special) {
      this.elementCache.set(objectName, special);
      return special;
    }

    const locator = this.pageSpec.getObjectLocator(objectName);
    if (!locator) {
      return new AbsentPageElement();
    }

    const element = await this.page.getObject(objectName, locator);
    this.elementCache.set(objectName, element);
    return element;
  }

  async findMatchingObjects(pattern: string): Promise<string[]> {
    return this.pageSpec.findMatchingObjectNames(pattern);
  }

  convertValue(range: Range, realValue: number): number {
    if (range.isPercentage() && range.percentageOfValue) {
      const refValue = this.getPercentageReferenceValue(
        range.percentageOfValue,
      );
      if (refValue !== 0) {
        return (realValue / refValue) * 100;
      }
    }
    return realValue;
  }

  getReadableRangeAndValue(
    range: Range,
    realValue: number,
    convertedValue: number,
  ): string {
    if (range.isPercentage()) {
      return `${realValue}px [${convertedValue.toFixed(1)}% of ${range.percentageOfValue}]`;
    }
    return `${realValue}px which is not in range of ${range.prettyString()}`;
  }

  private getPercentageReferenceValue(objectPath: string): number {
    // objectPath format: "objectName/property" e.g. "viewport/width"
    // For now return 0, this will be resolved at runtime
    // TODO: resolve from cached element areas
    return 0;
  }
}
