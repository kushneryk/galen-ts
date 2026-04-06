import { Spec } from "../specs/spec.js";
import {
  SpecWidth,
  SpecHeight,
  SpecAbove,
  SpecBelow,
  SpecLeftOf,
  SpecRightOf,
  SpecInside,
  SpecNear,
  SpecContains,
  SpecCentered,
  SpecHorizontally,
  SpecVertically,
  SpecText,
  SpecCss,
  SpecVisible,
  SpecAbsent,
  SpecCount,
  SpecComponent,
  SpecImage,
} from "../specs/specs.js";
import { SpecValidation } from "./spec-validation.js";
import { SpecValidationWidth, SpecValidationHeight } from "./specs/validation-size.js";
import {
  specValidationAbove,
  specValidationBelow,
  specValidationLeftOf,
  specValidationRightOf,
} from "./specs/validation-direction.js";
import { SpecValidationInside } from "./specs/validation-inside.js";
import { SpecValidationNear } from "./specs/validation-near.js";
import { SpecValidationContains } from "./specs/validation-contains.js";
import { SpecValidationCentered } from "./specs/validation-centered.js";
import { SpecValidationHorizontally, SpecValidationVertically } from "./specs/validation-aligned.js";
import { SpecValidationText, SpecValidationCss } from "./specs/validation-text.js";
import { SpecValidationVisible, SpecValidationAbsent } from "./specs/validation-visibility.js";
import { SpecValidationCount } from "./specs/validation-count.js";
import { SpecValidationComponent } from "./specs/validation-component.js";
import { SpecValidationImage } from "./specs/validation-image.js";

type SpecConstructor = new (...args: any[]) => Spec;

const validationMap = new Map<SpecConstructor, SpecValidation<any>>();

// Size
validationMap.set(SpecWidth, new SpecValidationWidth());
validationMap.set(SpecHeight, new SpecValidationHeight());

// Direction
validationMap.set(SpecAbove, specValidationAbove);
validationMap.set(SpecBelow, specValidationBelow);
validationMap.set(SpecLeftOf, specValidationLeftOf);
validationMap.set(SpecRightOf, specValidationRightOf);

// Complex position
validationMap.set(SpecInside, new SpecValidationInside());
validationMap.set(SpecNear, new SpecValidationNear());
validationMap.set(SpecContains, new SpecValidationContains());

// Alignment
validationMap.set(SpecCentered, new SpecValidationCentered());
validationMap.set(SpecHorizontally, new SpecValidationHorizontally());
validationMap.set(SpecVertically, new SpecValidationVertically());

// Content
validationMap.set(SpecText, new SpecValidationText());
validationMap.set(SpecCss, new SpecValidationCss());

// Visibility
validationMap.set(SpecVisible, new SpecValidationVisible());
validationMap.set(SpecAbsent, new SpecValidationAbsent());

// Count
validationMap.set(SpecCount, new SpecValidationCount());

// Component
validationMap.set(SpecComponent, new SpecValidationComponent());

// Image
validationMap.set(SpecImage, new SpecValidationImage());

export function getValidation<T extends Spec>(spec: T): SpecValidation<T> {
  const constructor = spec.constructor as SpecConstructor;
  const validation = validationMap.get(constructor);
  if (!validation) {
    throw new Error(
      `No validation registered for spec type: ${constructor.name}`,
    );
  }
  return validation as SpecValidation<T>;
}
