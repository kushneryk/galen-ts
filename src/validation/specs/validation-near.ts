import { SpecNear } from "../../specs/specs.js";
import { Side, oppositeSide } from "../../specs/side.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import { MetaBasedValidation } from "../meta-based-validation.js";
import type { ValidationResult, LayoutMeta } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export class SpecValidationNear extends SpecValidation<SpecNear> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecNear,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    const allMeta: LayoutMeta[] = [];
    const errorMessages: string[] = [];

    for (const location of spec.locations) {
      for (const side of location.sides) {
        const result = MetaBasedValidation.forObjects(
          objectName,
          spec.object,
          location.range,
        )
          .withFirstEdge(oppositeSide(side))
          .withSecondEdge(side)
          .withInvertedCalculation(side === Side.LEFT || side === Side.TOP)
          .validate(mainArea, secondArea, pageValidation, side);

        allMeta.push(result.meta);
        if (result.error) {
          errorMessages.push(
            `"${objectName}" is ${result.error} near "${spec.object}" ${side}`,
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
}
