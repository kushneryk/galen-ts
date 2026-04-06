import { SpecInside } from "../../specs/specs.js";
import { Side } from "../../specs/side.js";
import { Rect } from "../../page/rect.js";
import { Point } from "../../page/point.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import { MetaBasedValidation } from "../meta-based-validation.js";
import type { ValidationResult, LayoutMeta } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationInside extends SpecValidation<SpecInside> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecInside,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    // Check if completely inside (unless partly)
    if (!spec.partly) {
      this.checkIfCompletelyInside(objectName, spec, mainArea, secondArea);
    }

    // Validate each location's sides
    const allMeta: LayoutMeta[] = [];
    const errorMessages: string[] = [];

    for (const location of spec.locations) {
      for (const side of location.sides) {
        const result = MetaBasedValidation.forObjects(
          objectName,
          spec.object,
          location.range,
        )
          .withBothEdges(side)
          .withInvertedCalculation(side === Side.RIGHT || side === Side.BOTTOM)
          .validate(mainArea, secondArea, pageValidation, side);

        allMeta.push(result.meta);
        if (result.error) {
          errorMessages.push(
            `"${objectName}" ${side} edge is ${result.error} ${spec.object}`,
          );
        }
      }
    }

    if (errorMessages.length > 0) {
      const err = new ValidationErrorException(errorMessages[0]);
      for (let i = 1; i < errorMessages.length; i++) {
        err.withMessage(errorMessages[i]);
      }
      err.withObject({ name: objectName, area: mainArea });
      err.withObject({ name: spec.object, area: secondArea });
      err.withMeta(allMeta);
      throw err;
    }

    return {
      spec,
      objects: [
        { name: objectName, area: mainArea },
        { name: spec.object, area: secondArea },
      ],
      meta: allMeta,
      warnings: [],
    };
  }

  private checkIfCompletelyInside(
    objectName: string,
    spec: SpecInside,
    mainArea: Rect,
    secondArea: Rect,
  ): void {
    const corners = [
      new Point(mainArea.left, mainArea.top),
      new Point(mainArea.right, mainArea.top),
      new Point(mainArea.right, mainArea.bottom),
      new Point(mainArea.left, mainArea.bottom),
    ];

    let maxOffset = 0;
    for (const corner of corners) {
      const offset = this.calculatePointOffset(secondArea, corner);
      if (offset > maxOffset) {
        maxOffset = offset;
      }
    }

    if (maxOffset > 2) {
      const err = new ValidationErrorException(
        `"${objectName}" is not completely inside "${spec.object}". The offset is ${maxOffset}px.`,
      );
      err.withObject({ name: objectName, area: mainArea });
      err.withObject({ name: spec.object, area: secondArea });
      throw err;
    }
  }

  private calculatePointOffset(rect: Rect, point: Point): number {
    if (rect.contains(point)) return 0;

    let dx = 0;
    let dy = 0;

    if (point.left < rect.left) dx = rect.left - point.left;
    else if (point.left > rect.right) dx = point.left - rect.right;

    if (point.top < rect.top) dy = rect.top - point.top;
    else if (point.top > rect.bottom) dy = point.top - rect.bottom;

    return Math.max(dx, dy);
  }
}
