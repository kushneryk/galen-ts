import { SpecHorizontally, SpecVertically, Alignment } from "../../specs/specs.js";
import { Rect } from "../../page/rect.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationHorizontally extends SpecValidation<SpecHorizontally> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecHorizontally,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    const offset = getHorizontalOffset(spec.alignment, mainArea, secondArea);

    if (offset > Math.abs(spec.errorRate)) {
      const err = new ValidationErrorException(
        `"${spec.object}" is not aligned horizontally ${spec.alignment} with "${objectName}". Offset is ${offset}px`,
      );
      err.withObject({ name: objectName, area: mainArea });
      err.withObject({ name: spec.object, area: secondArea });
      throw err;
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

export class SpecValidationVertically extends SpecValidation<SpecVertically> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecVertically,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    const offset = getVerticalOffset(spec.alignment, mainArea, secondArea);

    if (offset > Math.abs(spec.errorRate)) {
      const err = new ValidationErrorException(
        `"${spec.object}" is not aligned vertically ${spec.alignment} with "${objectName}". Offset is ${offset}px`,
      );
      err.withObject({ name: objectName, area: mainArea });
      err.withObject({ name: spec.object, area: secondArea });
      throw err;
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

function getHorizontalOffset(
  alignment: Alignment,
  mainArea: Rect,
  childArea: Rect,
): number {
  switch (alignment) {
    case Alignment.CENTERED:
      return Math.abs(
        childArea.top + childArea.height / 2 - (mainArea.top + mainArea.height / 2),
      );
    case Alignment.TOP:
      return Math.abs(childArea.top - mainArea.top);
    case Alignment.BOTTOM:
      return Math.abs(childArea.bottom - mainArea.bottom);
    case Alignment.ALL:
      return Math.max(
        Math.abs(childArea.top - mainArea.top),
        Math.abs(childArea.height - mainArea.height),
      );
    default:
      return 0;
  }
}

function getVerticalOffset(
  alignment: Alignment,
  mainArea: Rect,
  childArea: Rect,
): number {
  switch (alignment) {
    case Alignment.CENTERED:
      return Math.abs(
        childArea.left + childArea.width / 2 - (mainArea.left + mainArea.width / 2),
      );
    case Alignment.LEFT:
      return Math.abs(childArea.left - mainArea.left);
    case Alignment.RIGHT:
      return Math.abs(childArea.right - mainArea.right);
    case Alignment.ALL:
      return Math.max(
        Math.abs(childArea.left - mainArea.left),
        Math.abs(childArea.width - mainArea.width),
      );
    default:
      return 0;
  }
}
