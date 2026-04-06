import { Spec } from "../specs/spec.js";
import type {
  ValidationResult,
  ValidationListener,
} from "../validation/validation-result.js";

export class CombinedValidationListener implements ValidationListener {
  constructor(private readonly listeners: ValidationListener[]) {}

  onBeforeObjectValidation(objectName: string, spec: Spec): void {
    for (const l of this.listeners) {
      l.onBeforeObjectValidation(objectName, spec);
    }
  }

  onAfterObjectValidation(
    objectName: string,
    spec: Spec,
    result: ValidationResult,
  ): void {
    for (const l of this.listeners) {
      l.onAfterObjectValidation(objectName, spec, result);
    }
  }

  onBeforeSection(sectionName: string): void {
    for (const l of this.listeners) {
      l.onBeforeSection(sectionName);
    }
  }

  onAfterSection(sectionName: string): void {
    for (const l of this.listeners) {
      l.onAfterSection(sectionName);
    }
  }
}
