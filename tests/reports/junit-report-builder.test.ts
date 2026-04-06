import { describe, it, expect } from "vitest";
import { JunitReportBuilder } from "../../src/reports/junit-report-builder.js";
import { LayoutReport } from "../../src/reports/layout-report.js";

describe("JunitReportBuilder", () => {
  it("generates valid XML structure", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: "header", specs: [
          { name: "visible", status: "passed", errors: [], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];

    const xml = new JunitReportBuilder().build(report);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<testsuites>");
    expect(xml).toContain("</testsuites>");
    expect(xml).toContain("tests=\"1\"");
    expect(xml).toContain("failures=\"0\"");
  });

  it("includes failure elements for error specs", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: "btn", specs: [
          { name: "width 100px", status: "error", errors: ["too wide"], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];

    const xml = new JunitReportBuilder().build(report);
    expect(xml).toContain("<failure");
    expect(xml).toContain("too wide");
    expect(xml).toContain("failures=\"1\"");
  });

  it("prefixes spec names with object names", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: "header", specs: [
          { name: "visible", status: "passed", errors: [], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];

    const xml = new JunitReportBuilder().build(report);
    expect(xml).toContain("header: visible");
  });

  it("escapes XML special characters", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: 'obj"<>&', specs: [
          { name: "test", status: "passed", errors: [], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];

    const xml = new JunitReportBuilder().build(report);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&lt;");
    expect(xml).toContain("&gt;");
    expect(xml).toContain("&quot;");
  });
});
