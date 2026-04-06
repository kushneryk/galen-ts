import { describe, it, expect } from "vitest";
import { SectionValidation } from "../../src/validation/section-validation.js";
import { PageValidation } from "../../src/validation/page-validation.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { Locator } from "../../src/specs/page/locator.js";
import { SpecWidth, SpecVisible } from "../../src/specs/specs.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Rect } from "../../src/page/rect.js";
import { buildPageValidation } from "../helpers/mock-page-element.js";

describe("SectionValidation", () => {
  it("iterates all sections and collects results", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    ps.addSection({
      name: "Main",
      objects: [{
        objectName: "btn",
        specs: [new SpecVisible()],
        specGroups: [],
      }],
      sections: [],
    });

    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50) } }, ps);
    const sv = new SectionValidation(pv, ps);
    const report = await sv.check();
    expect(report.results).toHaveLength(1);
    expect(report.errors).toBe(0);
  });

  it("counts errors correctly", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    ps.addSection({
      name: "Main",
      objects: [{
        objectName: "btn",
        specs: [new SpecWidth(Range.exact(new RangeValue(999)))],
        specGroups: [],
      }],
      sections: [],
    });

    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50) } }, ps);
    const sv = new SectionValidation(pv, ps);
    const report = await sv.check();
    expect(report.errors).toBe(1);
  });

  it("handles nested sections", async () => {
    const ps = new PageSpec();
    ps.addObject("a", Locator.css(".a"));
    ps.addSection({
      name: "Outer",
      objects: [],
      sections: [{
        name: "Inner",
        objects: [{
          objectName: "a",
          specs: [new SpecVisible()],
          specGroups: [],
        }],
        sections: [],
      }],
    });

    const pv = buildPageValidation({ a: { rect: new Rect(0, 0, 10, 10) } }, ps);
    const sv = new SectionValidation(pv, ps);
    const report = await sv.check();
    expect(report.results).toHaveLength(1);
  });
});
