import { Spec } from "../../specs/spec.js";
import { Range } from "../../specs/range.js";
import { SpecWidth, SpecHeight } from "../../specs/specs.js";
import { PageElement } from "../../page/page-element.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult, LayoutMeta } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

abstract class SpecValidationSize<T extends Spec & { range: Range }> extends SpecValidation<T> {
  protected abstract getSizeValue(area: { width: number; height: number }): number;
  protected abstract getUnitName(): string;

  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: T,
  ): Promise<ValidationResult> {
    const element = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(element, objectName);

    const area = await element.getArea();
    const realValue = this.getSizeValue(area);
    const convertedValue = pageValidation.convertValue(spec.range, realValue);

    const meta: LayoutMeta = {
      key: `${objectName}/${this.getUnitName()}`,
      value: `${realValue}px`,
    };

    if (!spec.range.holds(convertedValue)) {
      const readable = pageValidation.getReadableRangeAndValue(
        spec.range,
        realValue,
        convertedValue,
      );
      const err = new ValidationErrorException(
        `"${objectName}" ${this.getUnitName()} is ${readable}`,
      );
      err.withObject({ name: objectName, area });
      err.withMeta([meta]);
      throw err;
    }

    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [meta],
      warnings: [],
    };
  }
}

export class SpecValidationWidth extends SpecValidationSize<SpecWidth> {
  protected getSizeValue(area: { width: number }): number {
    return area.width;
  }
  protected getUnitName(): string {
    return "width";
  }
}

export class SpecValidationHeight extends SpecValidationSize<SpecHeight> {
  protected getSizeValue(area: { height: number }): number {
    return area.height;
  }
  protected getUnitName(): string {
    return "height";
  }
}
