import { describe, it, expect } from "vitest";
import { LayoutReport, LayoutReportListener } from "../../src/reports/layout-report.js";
import { SpecVisible } from "../../src/specs/specs.js";
import { Rect } from "../../src/page/rect.js";

describe("LayoutReport", () => {
  it("counts errors across nested sections", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S1", objects: [{
        name: "obj", specs: [
          { name: "visible", status: "error", errors: ["err"], warnings: [], meta: [] },
          { name: "width", status: "passed", errors: [], warnings: [], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];
    expect(report.errors).toBe(1);
    expect(report.passed).toBe(1);
    expect(report.total).toBe(2);
  });

  it("counts warnings", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: "x", specs: [
          { name: "s", status: "warning", errors: [], warnings: ["w"], meta: [] },
        ], specGroups: [],
      }], sections: [],
    }];
    expect(report.warnings).toBe(1);
  });

  it("counts specs inside specGroups", () => {
    const report = new LayoutReport();
    report.sections = [{
      name: "S", objects: [{
        name: "x", specs: [],
        specGroups: [{ name: "g", specs: [
          { name: "s", status: "passed", errors: [], warnings: [], meta: [] },
        ] }],
      }], sections: [],
    }];
    expect(report.passed).toBe(1);
  });
});

describe("LayoutReportListener", () => {
  it("builds report with sections and specs", () => {
    const listener = new LayoutReportListener();
    const spec = new SpecVisible();
    spec.originalText = "visible";

    listener.onBeforeSection("Main");
    listener.onBeforeObjectValidation("btn", spec);
    listener.onAfterObjectValidation("btn", spec, {
      spec,
      objects: [{ name: "btn", area: new Rect(0, 0, 100, 50) }],
      meta: [],
      warnings: [],
    });
    listener.onAfterSection("Main");

    const report = listener.buildReport();
    expect(report.sections).toHaveLength(1);
    expect(report.sections[0].name).toBe("Main");
    expect(report.sections[0].objects[0].specs[0].status).toBe("passed");
  });

  it("records object area in report.objects", () => {
    const listener = new LayoutReportListener();
    const spec = new SpecVisible();
    listener.onBeforeSection("S");
    listener.onBeforeObjectValidation("el", spec);
    listener.onAfterObjectValidation("el", spec, {
      spec,
      objects: [{ name: "el", area: new Rect(10, 20, 30, 40) }],
      meta: [],
      warnings: [],
    });
    listener.onAfterSection("S");

    const report = listener.buildReport();
    expect(report.objects.get("el")).toEqual({ area: [10, 20, 30, 40] });
  });

  it("records error status for failed specs", () => {
    const listener = new LayoutReportListener();
    const spec = new SpecVisible();
    listener.onBeforeSection("S");
    listener.onBeforeObjectValidation("el", spec);
    listener.onAfterObjectValidation("el", spec, {
      spec,
      objects: [],
      error: { messages: ["not visible"] },
      meta: [],
      warnings: [],
    });
    listener.onAfterSection("S");

    const report = listener.buildReport();
    expect(report.sections[0].objects[0].specs[0].status).toBe("error");
    expect(report.sections[0].objects[0].specs[0].errors).toEqual(["not visible"]);
  });
});
