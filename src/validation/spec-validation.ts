import { Spec } from "../specs/spec.js";
import { PageElement } from "../page/page-element.js";
import type { ValidationResult, ValidationObject, LayoutMeta } from "./validation-result.js";
import type { PageValidation } from "./page-validation.js";

export class ValidationErrorException extends Error {
  readonly validationObjects: ValidationObject[] = [];
  readonly messages: string[] = [];
  readonly meta: LayoutMeta[] = [];

  constructor(message?: string) {
    super(message);
    this.name = "ValidationErrorException";
    if (message) this.messages.push(message);
  }

  withMessage(msg: string): this {
    this.messages.push(msg);
    return this;
  }

  withObject(obj: ValidationObject): this {
    this.validationObjects.push(obj);
    return this;
  }

  withMeta(meta: LayoutMeta[]): this {
    this.meta.push(...meta);
    return this;
  }

  asValidationResult(spec: Spec): ValidationResult {
    return {
      spec,
      objects: this.validationObjects,
      error: { messages: this.messages },
      meta: this.meta,
      warnings: [],
    };
  }
}

export abstract class SpecValidation<T extends Spec> {
  abstract check(
    pageValidation: PageValidation,
    objectName: string,
    spec: T,
  ): Promise<ValidationResult>;

  protected async checkAvailability(
    element: PageElement,
    objectName: string,
  ): Promise<void> {
    if (!(await element.isPresent())) {
      throw new ValidationErrorException(
        `"${objectName}" is absent on page`,
      );
    }
    if (!(await element.isVisible())) {
      throw new ValidationErrorException(
        `"${objectName}" is not visible on page`,
      );
    }
  }
}
