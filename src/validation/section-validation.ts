import type { PageSpec, PageSection, ObjectSpecs } from "../specs/page/page-spec.js";
import type { ValidationResult, ValidationListener } from "./validation-result.js";
import { PageValidation } from "./page-validation.js";

export interface SectionValidationReport {
  results: ValidationResult[];
  errors: number;
  warnings: number;
}

export class SectionValidation {
  constructor(
    private readonly pageValidation: PageValidation,
    private readonly pageSpec: PageSpec,
    private readonly listener?: ValidationListener,
  ) {}

  async check(): Promise<SectionValidationReport> {
    const results: ValidationResult[] = [];
    let errors = 0;
    let warnings = 0;

    for (const section of this.pageSpec.sections) {
      const sectionResults = await this.checkSection(section);
      for (const result of sectionResults) {
        results.push(result);
        if (result.error) errors++;
        if (result.warnings.length > 0) warnings++;
      }
    }

    return { results, errors, warnings };
  }

  private async checkSection(
    section: PageSection,
  ): Promise<ValidationResult[]> {
    this.listener?.onBeforeSection(section.name);

    const results: ValidationResult[] = [];

    for (const objectSpecs of section.objects) {
      const objectResults = await this.checkObjectSpecs(objectSpecs);
      results.push(...objectResults);
    }

    for (const subsection of section.sections) {
      const subResults = await this.checkSection(subsection);
      results.push(...subResults);
    }

    this.listener?.onAfterSection(section.name);
    return results;
  }

  private async checkObjectSpecs(
    objectSpecs: ObjectSpecs,
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const spec of objectSpecs.specs) {
      const result = await this.pageValidation.check(
        objectSpecs.objectName,
        spec,
      );
      results.push(result);
    }

    for (const group of objectSpecs.specGroups) {
      for (const spec of group.specs) {
        const result = await this.pageValidation.check(
          objectSpecs.objectName,
          spec,
        );
        results.push(result);
      }
    }

    return results;
  }
}
