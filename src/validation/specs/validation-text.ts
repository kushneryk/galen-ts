import { SpecText, SpecCss, TextCheckType } from "../../specs/specs.js";
import { Spec } from "../../specs/spec.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

function applyOperations(text: string, operations: string[]): string {
  let result = text;
  for (const op of operations) {
    switch (op.toLowerCase()) {
      case "lowercase":
        result = result.toLowerCase();
        break;
      case "uppercase":
        result = result.toUpperCase();
        break;
      case "trim":
        result = result.trim();
        break;
      case "singleline":
        result = result.replace(/\n/g, " ");
        break;
    }
  }
  return result;
}

function checkTextValue(
  type: TextCheckType,
  realText: string,
  expectedText: string,
): boolean {
  switch (type) {
    case TextCheckType.IS:
      return realText === expectedText;
    case TextCheckType.CONTAINS:
      return realText.includes(expectedText);
    case TextCheckType.STARTS:
      return realText.startsWith(expectedText);
    case TextCheckType.ENDS:
      return realText.endsWith(expectedText);
    case TextCheckType.MATCHES:
      return new RegExp(expectedText, "s").test(realText);
  }
}

function typeVerb(type: TextCheckType): string {
  switch (type) {
    case TextCheckType.IS:
      return "should be";
    case TextCheckType.CONTAINS:
      return "should contain";
    case TextCheckType.STARTS:
      return "should start with";
    case TextCheckType.ENDS:
      return "should end with";
    case TextCheckType.MATCHES:
      return "should match";
  }
}

export class SpecValidationText extends SpecValidation<SpecText> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecText,
  ): Promise<ValidationResult> {
    const element = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(element, objectName);

    const area = await element.getArea();
    let realText = await element.getText();
    realText = applyOperations(realText, spec.operations);

    if (!checkTextValue(spec.type, realText, spec.text)) {
      const err = new ValidationErrorException(
        `"${objectName}" text is "${realText}" but ${typeVerb(spec.type)} "${spec.text}"`,
      );
      err.withObject({ name: objectName, area });
      throw err;
    }

    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [],
      warnings: [],
    };
  }
}

export class SpecValidationCss extends SpecValidation<SpecCss> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecCss,
  ): Promise<ValidationResult> {
    const element = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(element, objectName);

    const area = await element.getArea();
    let realValue = await element.getCssProperty(spec.cssPropertyName);
    realValue = applyOperations(realValue, spec.operations);

    if (!checkTextValue(spec.type, realValue, spec.text)) {
      const err = new ValidationErrorException(
        `"${objectName}" css property "${spec.cssPropertyName}" is "${realValue}" but ${typeVerb(spec.type)} "${spec.text}"`,
      );
      err.withObject({ name: objectName, area });
      throw err;
    }

    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [],
      warnings: [],
    };
  }
}
