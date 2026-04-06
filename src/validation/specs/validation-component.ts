import { SpecComponent } from "../../specs/specs.js";
import { SpecValidation, ValidationErrorException } from "../spec-validation.js";
import { PageValidation } from "../page-validation.js";
import { SectionValidation } from "../section-validation.js";
import { PageSpecReader } from "../../parser/page-spec-reader.js";
import type { ValidationResult } from "../validation-result.js";

export class SpecValidationComponent extends SpecValidation<SpecComponent> {
  async check(
    pageValidation: PageValidation,
    objectName: string,
    spec: SpecComponent,
  ): Promise<ValidationResult> {
    const mainElement = await pageValidation.findPageElement(objectName);
    await this.checkAvailability(mainElement, objectName);
    const area = await mainElement.getArea();

    // Load component spec
    const reader = new PageSpecReader();
    const variables: Record<string, unknown> = {
      ...spec.jsVariables,
      ...spec.args,
    };

    let pageSpec;
    try {
      pageSpec = reader.readFile(spec.specPath, { variables });
    } catch (e) {
      throw new ValidationErrorException(
        `Cannot load component spec "${spec.specPath}": ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Validate sub-spec using the same page
    const subPageValidation = new PageValidation(
      pageValidation["page" as keyof PageValidation] as any,
      pageSpec,
    );

    const sectionValidation = new SectionValidation(
      subPageValidation,
      pageSpec,
    );

    const subReport = await sectionValidation.check();

    if (subReport.errors > 0) {
      const errorMessages = subReport.results
        .filter((r) => r.error)
        .flatMap((r) => r.error!.messages);

      const err = new ValidationErrorException(
        `Component "${spec.specPath}" has ${subReport.errors} error(s)`,
      );
      err.withObject({ name: objectName, area });
      for (const msg of errorMessages) {
        err.withMessage(msg);
      }
      throw err;
    }

    return {
      spec,
      objects: [{ name: objectName, area }],
      meta: [],
      warnings: subReport.results
        .filter((r) => r.warnings.length > 0)
        .flatMap((r) => r.warnings),
    };
  }
}
