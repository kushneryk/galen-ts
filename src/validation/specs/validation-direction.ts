import { SpecDirectionPosition, SpecAbove, SpecBelow, SpecLeftOf, SpecRightOf } from "../../specs/specs.js";
import { Side } from "../../specs/side.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import { MetaBasedValidation } from "../meta-based-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

interface DirectionConfig {
  name: string;
  firstEdge: Side;
  secondEdge: Side;
  inverted: boolean;
}

const DIRECTIONS: Record<string, DirectionConfig> = {
  above: { name: "above", firstEdge: Side.BOTTOM, secondEdge: Side.TOP, inverted: true },
  below: { name: "below", firstEdge: Side.TOP, secondEdge: Side.BOTTOM, inverted: false },
  "left-of": { name: "left of", firstEdge: Side.RIGHT, secondEdge: Side.LEFT, inverted: true },
  "right-of": { name: "right of", firstEdge: Side.LEFT, secondEdge: Side.RIGHT, inverted: false },
};

class SpecValidationDirectionPosition extends SpecValidation<SpecDirectionPosition> {
  constructor(private readonly direction: DirectionConfig) {
    super();
  }

  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecDirectionPosition,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);

    const secondElement = await pageValidation.findPageElement(spec.object);
    await this.checkAvailability(secondElement, spec.object);

    const mainArea = await mainElement.getArea();
    const secondArea = await secondElement.getArea();

    const result = await MetaBasedValidation.forObjects(
      objectName,
      spec.object,
      spec.range,
    )
      .withFirstEdge(this.direction.firstEdge)
      .withSecondEdge(this.direction.secondEdge)
      .withInvertedCalculation(this.direction.inverted)
      .validate(mainArea, secondArea, pageValidation, this.direction.name);

    if (result.error) {
      const err = new ValidationErrorException(
        `"${objectName}" is ${result.error} instead of ${spec.range.prettyString()} ${this.direction.name} "${spec.object}"`,
      );
      err.withObject({ name: objectName, area: mainArea });
      err.withObject({ name: spec.object, area: secondArea });
      err.withMeta([result.meta]);
      throw err;
    }

    return {
      spec,
      objects: [
        { name: objectName, area: mainArea },
        { name: spec.object, area: secondArea },
      ],
      meta: [result.meta],
      warnings: [],
    };
  }
}

export const specValidationAbove = new SpecValidationDirectionPosition(DIRECTIONS.above);
export const specValidationBelow = new SpecValidationDirectionPosition(DIRECTIONS.below);
export const specValidationLeftOf = new SpecValidationDirectionPosition(DIRECTIONS["left-of"]);
export const specValidationRightOf = new SpecValidationDirectionPosition(DIRECTIONS["right-of"]);
