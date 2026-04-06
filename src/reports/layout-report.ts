import { Spec } from "../specs/spec.js";
import { Rect } from "../page/rect.js";
import type {
  ValidationResult,
  ValidationListener,
  LayoutMeta,
} from "../validation/validation-result.js";

// --- Report model ---

export interface LayoutSpecResult {
  name: string;
  status: "passed" | "warning" | "error";
  place?: string;
  errors: string[];
  warnings: string[];
  meta: LayoutMeta[];
  subLayout?: LayoutReport;
}

export interface LayoutSpecGroup {
  name: string;
  specs: LayoutSpecResult[];
}

export interface LayoutObject {
  name: string;
  area?: Rect;
  specs: LayoutSpecResult[];
  specGroups: LayoutSpecGroup[];
}

export interface LayoutSection {
  name: string;
  place?: string;
  objects: LayoutObject[];
  sections: LayoutSection[];
}

export class LayoutReport {
  title?: string;
  sections: LayoutSection[] = [];
  objects: Map<string, { area: number[] }> = new Map();
  screenshot?: Buffer;
  includedTags: string[] = [];
  excludedTags: string[] = [];

  get errors(): number {
    return this.countByStatus("error");
  }

  get warnings(): number {
    return this.countByStatus("warning");
  }

  get passed(): number {
    return this.countByStatus("passed");
  }

  get total(): number {
    return this.errors + this.warnings + this.passed;
  }

  private countByStatus(status: string): number {
    let count = 0;
    const visitSection = (section: LayoutSection) => {
      for (const obj of section.objects) {
        for (const spec of obj.specs) {
          if (spec.status === status) count++;
        }
        for (const group of obj.specGroups) {
          for (const spec of group.specs) {
            if (spec.status === status) count++;
          }
        }
      }
      for (const sub of section.sections) visitSection(sub);
    };
    for (const s of this.sections) visitSection(s);
    return count;
  }
}

// --- Report listener ---

interface StackEntry {
  section: LayoutSection;
  currentObject?: LayoutObject;
  currentSpecGroup?: LayoutSpecGroup;
}

export class LayoutReportListener implements ValidationListener {
  private readonly stack: StackEntry[] = [];
  private readonly report = new LayoutReport();

  constructor() {
    // Start with a root section
    const root: LayoutSection = { name: "", place: undefined, objects: [], sections: [] };
    this.report.sections.push(root);
    this.stack.push({ section: root });
  }

  onBeforeSection(sectionName: string): void {
    const section: LayoutSection = {
      name: sectionName,
      objects: [],
      sections: [],
    };

    const current = this.currentEntry();
    current.section.sections.push(section);
    this.stack.push({ section });
  }

  onAfterSection(_sectionName: string): void {
    if (this.stack.length > 1) {
      this.stack.pop();
    }
  }

  onBeforeObjectValidation(objectName: string, _spec: Spec): void {
    const entry = this.currentEntry();

    // Find or create object in current section
    let obj = entry.section.objects.find((o) => o.name === objectName);
    if (!obj) {
      obj = { name: objectName, specs: [], specGroups: [] };
      entry.section.objects.push(obj);
    }
    entry.currentObject = obj;
  }

  onAfterObjectValidation(
    objectName: string,
    _spec: Spec,
    result: ValidationResult,
  ): void {
    const entry = this.currentEntry();

    // Register object area
    if (result.objects.length > 0 && result.objects[0].area) {
      const area = result.objects[0].area;
      this.report.objects.set(objectName, {
        area: area.toArray(),
      });
    }

    // Build spec result
    const specResult: LayoutSpecResult = {
      name: result.spec.toText(),
      status: result.error ? "error" : result.warnings.length > 0 ? "warning" : "passed",
      place: result.spec.place?.toPrettyString(),
      errors: result.error?.messages ?? [],
      warnings: result.warnings,
      meta: result.meta,
    };

    // Add to current object or spec group
    if (entry.currentObject) {
      if (entry.currentSpecGroup) {
        entry.currentSpecGroup.specs.push(specResult);
      } else {
        entry.currentObject.specs.push(specResult);
      }
    }
  }

  buildReport(): LayoutReport {
    // Remove the initial empty root section if it has no content
    if (
      this.report.sections.length === 1 &&
      this.report.sections[0].name === "" &&
      this.report.sections[0].objects.length === 0 &&
      this.report.sections[0].sections.length > 0
    ) {
      this.report.sections = this.report.sections[0].sections;
    }
    return this.report;
  }

  private currentEntry(): StackEntry {
    return this.stack[this.stack.length - 1];
  }
}
