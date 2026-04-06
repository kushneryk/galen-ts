import { describe, it, expect } from "vitest";
import { HtmlReportBuilder } from "../../src/reports/html-report-builder.js";
import { LayoutReport } from "../../src/reports/layout-report.js";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("HtmlReportBuilder", () => {
  it("generates HTML with report data", () => {
    const report = new LayoutReport();
    report.title = "Test <Report>";
    report.sections = [{
      name: "S", objects: [{
        name: "el", specs: [
          { name: "visible", status: "passed" as const, errors: [], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];

    const dir = join(tmpdir(), `galen-test-${Date.now()}`);
    new HtmlReportBuilder().build(report, dir);

    const html = readFileSync(join(dir, "report.html"), "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("REPORT_DATA");
    expect(html).toContain("Test &lt;Report&gt;");

    const json = readFileSync(join(dir, "report.json"), "utf-8");
    expect(JSON.parse(json)).toBeDefined();

    rmSync(dir, { recursive: true });
  });
});
