import { describe, it, expect } from "vitest";
import { PageValidation } from "../../src/validation/page-validation.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { Locator } from "../../src/specs/page/locator.js";
import { SpecWidth, SpecVisible } from "../../src/specs/specs.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Rect } from "../../src/page/rect.js";
import { mockPage, mockElement, buildPageValidation } from "../helpers/mock-page-element.js";

describe("PageValidation", () => {
  describe("check", () => {
    it("returns passing result for valid spec", async () => {
      const ps = new PageSpec();
      ps.addObject("el", Locator.css(".e"));
      const pv = buildPageValidation({ el: { rect: new Rect(0, 0, 100, 50) } }, ps);
      const r = await pv.check("el", new SpecWidth(Range.exact(new RangeValue(100))));
      expect(r.error).toBeUndefined();
    });

    it("returns error result for failing spec", async () => {
      const ps = new PageSpec();
      ps.addObject("el", Locator.css(".e"));
      const pv = buildPageValidation({ el: { rect: new Rect(0, 0, 200, 50) } }, ps);
      const r = await pv.check("el", new SpecWidth(Range.exact(new RangeValue(100))));
      expect(r.error).toBeDefined();
    });

    it("converts error to warning when onlyWarn is true", async () => {
      const ps = new PageSpec();
      ps.addObject("el", Locator.css(".e"));
      const pv = buildPageValidation({ el: { rect: new Rect(0, 0, 200, 50) } }, ps);
      const spec = new SpecWidth(Range.exact(new RangeValue(100)));
      spec.withOnlyWarn();
      const r = await pv.check("el", spec);
      expect(r.error).toBeUndefined();
      expect(r.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("findPageElement", () => {
    it("returns special object for 'viewport'", async () => {
      const ps = new PageSpec();
      const pv = new PageValidation(mockPage({}), ps);
      const el = await pv.findPageElement("viewport");
      const area = await el.getArea();
      expect(area.width).toBe(1024);
    });

    it("caches element on second call", async () => {
      const ps = new PageSpec();
      ps.addObject("el", Locator.css(".e"));
      const pv = buildPageValidation({ el: { rect: new Rect(0, 0, 50, 50) } }, ps);
      const el1 = await pv.findPageElement("el");
      const el2 = await pv.findPageElement("el");
      expect(el1).toBe(el2);
    });
  });

  describe("convertValue", () => {
    it("returns raw value for non-percentage range", async () => {
      const ps = new PageSpec();
      const pv = new PageValidation(mockPage({}), ps);
      expect(await pv.convertValue(Range.exact(new RangeValue(100)), 50)).toBe(50);
    });
  });
});
