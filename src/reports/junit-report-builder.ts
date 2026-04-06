import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { LayoutReport, LayoutSection, LayoutSpecResult } from "./layout-report.js";

export class JunitReportBuilder {
  build(report: LayoutReport, testName: string = "Galen Layout Test"): string {
    const specs = this.collectAllSpecs(report);
    const failures = specs.filter((s) => s.status === "error");
    const time = "0"; // No timing info from layout check

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites>\n`;
    xml += `  <testsuite name="${this.escapeXml(testName)}" tests="${specs.length}" failures="${failures.length}" time="${time}">\n`;

    for (const spec of specs) {
      xml += `    <testcase classname="${this.escapeXml(testName)}" name="${this.escapeXml(spec.name)}">\n`;

      if (spec.status === "error" && spec.errors.length > 0) {
        const message = spec.errors[0];
        const detail = spec.errors.join("\n");
        xml += `      <failure message="${this.escapeXml(message)}">${this.escapeXml(detail)}</failure>\n`;
      } else if (spec.status === "warning" && spec.warnings.length > 0) {
        // JUnit doesn't have warnings, so use system-out
        xml += `      <system-out>${this.escapeXml(spec.warnings.join("\n"))}</system-out>\n`;
      }

      xml += `    </testcase>\n`;
    }

    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;
    return xml;
  }

  writeToFile(
    report: LayoutReport,
    filePath: string,
    testName?: string,
  ): void {
    const xml = this.build(report, testName);
    const dir = resolve(filePath, "..");
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, xml, "utf-8");
  }

  private collectAllSpecs(report: LayoutReport): LayoutSpecResult[] {
    const results: LayoutSpecResult[] = [];
    const visitSection = (section: LayoutSection) => {
      for (const obj of section.objects) {
        for (const spec of obj.specs) {
          results.push({
            ...spec,
            name: `${obj.name}: ${spec.name}`,
          });
        }
        for (const group of obj.specGroups) {
          for (const spec of group.specs) {
            results.push({
              ...spec,
              name: `${obj.name} [${group.name}]: ${spec.name}`,
            });
          }
        }
      }
      for (const sub of section.sections) visitSection(sub);
    };
    for (const s of report.sections) visitSection(s);
    return results;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
