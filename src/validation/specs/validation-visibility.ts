import { SpecVisible, SpecAbsent } from "../../specs/specs.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationVisible extends SpecValidation<SpecVisible> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecVisible,
  ): Promise<ValidationResult> {
    const element = await pageValidation.findPageElement(objectName);

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

    const area = await element.getArea();
    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [],
      warnings: [],
    };
  }
}

export class SpecValidationAbsent extends SpecValidation<SpecAbsent> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecAbsent,
  ): Promise<ValidationResult> {
    const element = await pageValidation.findPageElement(objectName);

    const present = await element.isPresent();
    if (present && (await element.isVisible())) {
      const area = await element.getArea();
      const err = new ValidationErrorException(
        `"${objectName}" is not absent on page`,
      );
      err.withObject({ name: objectName, area });
      throw err;
    }

    return {
      spec,
      objects: [],
      meta: [],
      warnings: [],
    };
  }
}
