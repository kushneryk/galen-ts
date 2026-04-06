import { SpecContains } from "../../specs/specs.js";
import { Point } from "../../page/point.js";
import { Rect } from "../../page/rect.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult, ValidationObject } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationContains extends SpecValidation<SpecContains> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecContains,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const mainArea = await mainElement.getArea();
    const objects: ValidationObject[] = [{ name: objectName, area: mainArea }];
    const errorMessages: string[] = [];

    for (const childName of spec.childObjects) {
      const childElement = await pageValidation.findPageElement(childName);

      if (!(await childElement.isPresent())) {
        errorMessages.push(`"${childName}" is absent on page`);
        continue;
      }

      const childArea = await childElement.getArea();
      objects.push({ name: childName, area: childArea });

      if (!this.childObjectMatches(spec, mainArea, childArea)) {
        errorMessages.push(
          `"${childName}" is outside "${objectName}"`,
        );
      }
    }

    if (errorMessages.length > 0) {
      const err = new ValidationErrorException(errorMessages[0]);
      for (let i = 1; i < errorMessages.length; i++) {
        err.withMessage(errorMessages[i]);
      }
      for (const obj of objects) err.withObject(obj);
      throw err;
    }

    return {
      spec,
      objects,
      meta: [],
      warnings: [],
    };
  }

  private childObjectMatches(
    spec: SpecContains,
    parentArea: Rect,
    childArea: Rect,
  ): boolean {
    const corners = [
      new Point(childArea.left, childArea.top),
      new Point(childArea.right, childArea.top),
      new Point(childArea.right, childArea.bottom),
      new Point(childArea.left, childArea.bottom),
    ];

    let matchingPoints = 0;
    for (const corner of corners) {
      if (parentArea.contains(corner)) {
        matchingPoints++;
      }
    }

    return spec.partly ? matchingPoints > 0 : matchingPoints === 4;
  }
}
