import { SpecCentered, Alignment, CenteredLocation } from "../../specs/specs.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationCentered extends SpecValidation<SpecCentered> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecCentered,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    let offsetLeft = mainArea.left - secondArea.left;
    let offsetRight = secondArea.right - mainArea.right;
    let offsetTop = mainArea.top - secondArea.top;
    let offsetBottom = secondArea.bottom - mainArea.bottom;

    if (spec.location === CenteredLocation.ON) {
      offsetLeft = -offsetLeft;
      offsetRight = -offsetRight;
      offsetTop = -offsetTop;
      offsetBottom = -offsetBottom;
    }

    const locationText =
      spec.location === CenteredLocation.ON ? "on" : "inside";

    if (
      spec.alignment === Alignment.ALL ||
      spec.alignment === Alignment.LEFT ||
      spec.alignment === Alignment.RIGHT ||
      spec.alignment === Alignment.CENTERED
    ) {
      // Check horizontal centering
      const horizontalOffset = Math.abs(offsetLeft - offsetRight);
      if (horizontalOffset > spec.errorRate) {
        const err = new ValidationErrorException(
          `"${objectName}" is not centered horizontally ${locationText} "${spec.object}". Offset is ${horizontalOffset}px`,
        );
        err.withObject({ name: objectName, area: mainArea });
        err.withObject({ name: spec.object, area: secondArea });
        throw err;
      }
    }

    if (
      spec.alignment === Alignment.ALL ||
      spec.alignment === Alignment.TOP ||
      spec.alignment === Alignment.BOTTOM ||
      spec.alignment === Alignment.CENTERED
    ) {
      // Check vertical centering
      const verticalOffset = Math.abs(offsetTop - offsetBottom);
      if (verticalOffset > spec.errorRate) {
        const err = new ValidationErrorException(
          `"${objectName}" is not centered vertically ${locationText} "${spec.object}". Offset is ${verticalOffset}px`,
        );
        err.withObject({ name: objectName, area: mainArea });
        err.withObject({ name: spec.object, area: secondArea });
        throw err;
      }
    }

    return {
      spec,
      objects: [
        { name: objectName, area: mainArea },
        { name: spec.object, area: secondArea },
      ],
      meta: [],
      warnings: [],
    };
  }
}
