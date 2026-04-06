import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  LayoutReport,
  LayoutSection,
  LayoutObject,
  LayoutSpecResult,
} from "./layout-report.js";

export interface JsonLayoutReport {
  title?: string;
  includedTags: string[];
  excludedTags: string[];
  sections: JsonLayoutSection[];
  objects: Record<string, { area: number[] }>;
  statistics: {
    passed: number;
    errors: number;
    warnings: number;
    total: number;
  };
}

interface JsonLayoutSection {
  name: string;
  place?: string;
  objects: JsonLayoutObject[];
  sections: JsonLayoutSection[];
}

interface JsonLayoutObject {
  name: string;
  area?: number[];
  specs: JsonLayoutSpec[];
}

interface JsonLayoutSpec {
  name: string;
  status: string;
  place?: string;
  errors?: string[];
  warnings?: string[];
  meta?: { key: string; value: string }[];
}

export class JsonReportBuilder {
  build(report: LayoutReport): JsonLayoutReport {
    const objects: Record<string, { area: number[] }> = {};
    for (const [name, details] of report.objects) {
      objects[name] = details;
    }

    return {
      title: report.title,
      includedTags: report.includedTags,
      excludedTags: report.excludedTags,
      sections: report.sections.map((s) => this.buildSection(s)),
      objects,
      statistics: {
        passed: report.passed,
        errors: report.errors,
        warnings: report.warnings,
        total: report.total,
      },
    };
  }

  writeToFile(report: LayoutReport, filePath: string): void {
    const json = this.build(report);
    const dir = resolve(filePath, "..");
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
  }

  private buildSection(section: LayoutSection): JsonLayoutSection {
    return {
      name: section.name,
      place: section.place,
      objects: section.objects.map((o) => this.buildObject(o)),
      sections: section.sections.map((s) => this.buildSection(s)),
    };
  }

  private buildObject(obj: LayoutObject): JsonLayoutObject {
    const allSpecs = [
      ...obj.specs,
      ...obj.specGroups.flatMap((g) => g.specs),
    ];

    return {
      name: obj.name,
      area: obj.area?.toArray(),
      specs: allSpecs.map((s) => this.buildSpec(s)),
    };
  }

  private buildSpec(spec: LayoutSpecResult): JsonLayoutSpec {
    const result: JsonLayoutSpec = {
      name: spec.name,
      status: spec.status,
    };
    if (spec.place) result.place = spec.place;
    if (spec.errors.length > 0) result.errors = spec.errors;
    if (spec.warnings.length > 0) result.warnings = spec.warnings;
    if (spec.meta.length > 0) result.meta = spec.meta;
    return result;
  }
}
