import { SpecCount, CountFetchType } from "../../specs/specs.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationCount extends SpecValidation<SpecCount> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecCount,
  ): Promise<ValidationResult> {
    const matchingObjects = await pageValidation.findMatchingObjects(spec.pattern);
    let count: number;

    switch (spec.fetchType) {
      case CountFetchType.ANY:
        count = matchingObjects.length;
        break;
      case CountFetchType.VISIBLE: {
        let visible = 0;
        for (const name of matchingObjects) {
          const el = await pageValidation.findPageElement(name);
          if ((await el.isPresent()) && (await el.isVisible())) {
            visible++;
          }
        }
        count = visible;
        break;
      }
      case CountFetchType.ABSENT: {
        let absent = 0;
        for (const name of matchingObjects) {
          const el = await pageValidation.findPageElement(name);
          if (!(await el.isPresent()) || !(await el.isVisible())) {
            absent++;
          }
        }
        count = absent;
        break;
      }
    }

    if (!spec.amount.holds(count)) {
      throw new ValidationErrorException(
        `Number of ${spec.fetchType} objects "${spec.pattern}" is ${count} but should be ${spec.amount.prettyString("")}`,
      );
    }

    return {
      spec,
      objects: [],
      meta: [],
      warnings: [],
    };
  }
}
