import { Spec } from "../specs/spec.js";
import { Rect } from "../page/rect.js";

export interface ValidationObject {
  name: string;
  area?: Rect;
}

export interface LayoutMeta {
  key: string;
  value: string;
}

export interface ValidationError {
  messages: string[];
  imagePath?: string;
}

export interface ValidationResult {
  spec: Spec;
  objects: ValidationObject[];
  error?: ValidationError;
  meta: LayoutMeta[];
  warnings: string[];
}

export interface ValidationListener {
  onBeforeObjectValidation(
    objectName: string,
    spec: Spec,
  ): void;

  onAfterObjectValidation(
    objectName: string,
    spec: Spec,
    result: ValidationResult,
  ): void;

  onBeforeSection(sectionName: string): void;
  onAfterSection(sectionName: string): void;
}
