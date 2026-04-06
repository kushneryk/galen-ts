import { describe, it, expect } from "vitest";
import { JsonReportBuilder } from "../../src/reports/json-report-builder.js";
import { LayoutReport } from "../../src/reports/layout-report.js";
import { Rect } from "../../src/page/rect.js";

describe("JsonReportBuilder", () => {
  it("builds correct structure with statistics", () => {
    const report = new LayoutReport();
    report.title = "Test";
    report.includedTags = ["desktop"];
    report.sections = [{
      name: "Main",
      objects: [{
        name: "header", area: new Rect(0, 0, 100, 50),
        specs: [
          { name: "visible", status: "passed", errors: [], warnings: [], meta: [] },
          { name: "width", status: "error", errors: ["too wide"], warnings: [], meta: [] },
        ],
        specGroups: [],
      }],
      sections: [],
    }];
    report.objects.set("header", { area: [0, 0, 100, 50] });

    const json = new JsonReportBuilder().build(report);
    expect(json.title).toBe("Test");
    expect(json.includedTags).toEqual(["desktop"]);
    expect(json.statistics.passed).toBe(1);
    expect(json.statistics.errors).toBe(1);
    expect(json.statistics.total).toBe(2);
    expect(json.sections).toHaveLength(1);
    expect(json.objects["header"]).toBeDefined();
  });
});
