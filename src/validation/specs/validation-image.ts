import { readFileSync, existsSync } from "node:fs";
import { SpecImage, ErrorRateType } from "../../specs/specs.js";
import { Rect } from "../../page/rect.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import type { ValidationResult } from "../validation-result.js";
import type { PageValidation } from "../page-validation.js";

export interface ImageCompareResult {
  percentage: number;
  totalMismatchPixels: number;
  comparisonMap?: Buffer;
  offsetX: number;
  offsetY: number;
}

export type ImageComparator = (
  actual: Buffer,
  expected: Buffer,
  options: {
    tolerance?: number;
    area?: { left: number; top: number; width: number; height: number };
    analyzeOffset?: number;
  },
) => Promise<ImageCompareResult>;

let globalComparator: ImageComparator | null = null;

/**
 * Register a custom image comparator. Must be called before
 * running image spec validation. Accepts any comparison implementation
 * (e.g. pixelmatch, sharp, canvas-based, etc.)
 */
export function setImageComparator(comparator: ImageComparator): void {
  globalComparator = comparator;
}

export class SpecValidationImage extends SpecValidation<SpecImage> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecImage,
  ): Promise<ValidationResult> {
    if (!globalComparator) {
      throw new ValidationErrorException(
        "Image comparison requires a comparator. Call setImageComparator() first.",
      );
    }

    const element = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(element, objectName);

    const area = await element.getArea();

    // Take screenshot of the page
    const page = (pageValidation as any).page;
    let screenshot: Buffer;
    try {
      screenshot = await page.getScreenshot();
    } catch {
      throw new ValidationErrorException(
        `Cannot take screenshot for image comparison of "${objectName}"`,
      );
    }

    // Compare against each expected image, find best match
    let bestResult: ImageCompareResult | null = null;
    let bestDifference = Infinity;

    for (const imagePath of spec.imagePaths) {
      if (!existsSync(imagePath)) {
        throw new ValidationErrorException(
          `Expected image not found: "${imagePath}"`,
        );
      }

      const expectedImage = readFileSync(imagePath);
      const result = await globalComparator(screenshot, expectedImage, {
        tolerance: spec.tolerance,
        area: spec.selectedArea ?? {
          left: area.left,
          top: area.top,
          width: area.width,
          height: area.height,
        },
        analyzeOffset: spec.analyzeOffset,
      });

      const difference = spec.errorRate?.type === ErrorRateType.PERCENT
        ? result.percentage
        : result.totalMismatchPixels;

      if (difference < bestDifference) {
        bestDifference = difference;
        bestResult = result;
      }
    }

    if (!bestResult) {
      throw new ValidationErrorException(
        `No expected images specified for "${objectName}"`,
      );
    }

    // Evaluate against error rate
    const errorRateValue = spec.errorRate?.value ?? 0;
    const errorRateType = spec.errorRate?.type ?? ErrorRateType.PIXELS;
    const actualValue = errorRateType === ErrorRateType.PERCENT
      ? bestResult.percentage
      : bestResult.totalMismatchPixels;

    if (actualValue > errorRateValue) {
      const unit = errorRateType === ErrorRateType.PERCENT ? "%" : "px";
      const err = new ValidationErrorException(
        `"${objectName}" image comparison failed: difference is ${actualValue.toFixed(2)}${unit}, but max allowed is ${errorRateValue}${unit}`,
      );
      err.withObject({ name: objectName, area });
      throw err;
    }

    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [
        {
          key: `${objectName}/image-diff`,
          value: `${actualValue.toFixed(2)}${errorRateType === ErrorRateType.PERCENT ? "%" : "px"}`,
        },
      ],
      warnings: [],
    };
  }
}
