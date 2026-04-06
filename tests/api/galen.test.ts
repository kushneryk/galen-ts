import { describe, it, expect } from "vitest";
import { Galen } from "../../src/api/galen.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { Locator } from "../../src/specs/page/locator.js";
import { SpecVisible } from "../../src/specs/specs.js";
import { Rect } from "../../src/page/rect.js";
import { mockPage, buildPageValidation } from "../helpers/mock-page-element.js";

describe("Galen", () => {
  describe("readSpecFromText", () => {
    it("parses inline .gspec text", () => {
      const spec = Galen.readSpecFromText(`
@objects
  header css .header
  menu css .menu

= Layout =
  header:
    visible
`);
      expect(spec.getObjectLocator("header")).toBeDefined();
      expect(spec.getObjectLocator("menu")).toBeDefined();
      expect(spec.sections).toHaveLength(1);
    });
  });

  describe("checkLayout with PageSpec", () => {
    it("validates page against spec and returns report", async () => {
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

      const page = mockPage({
        btn: {
          async getArea() { return new Rect(0, 0, 100, 50); },
          async isPresent() { return true; },
          async isVisible() { return true; },
          async getText() { return ""; },
          async getCssProperty() { return ""; },
        },
      });

      const report = await Galen.checkLayout(page, ps);
      expect(report.errors).toBe(0);
      expect(report.passed).toBeGreaterThanOrEqual(1);
    });
  });
});
