import { describe, it, expect } from "vitest";
import { Locator, LocatorType, CorrectionType, applyCorrection } from "../../../src/specs/page/locator.js";

describe("Locator", () => {
  describe("factories", () => {
    it("css creates CSS locator", () => {
      const l = Locator.css(".header");
      expect(l.locatorType).toBe(LocatorType.CSS);
      expect(l.locatorValue).toBe(".header");
    });

    it("xpath creates XPATH locator", () => {
      const l = Locator.xpath("//div");
      expect(l.locatorType).toBe(LocatorType.XPATH);
      expect(l.locatorValue).toBe("//div");
    });

    it("id creates ID locator with # prefix", () => {
      const l = Locator.id("main");
      expect(l.locatorType).toBe(LocatorType.ID);
      expect(l.locatorValue).toBe("#main");
    });
  });

  describe("withCorrections", () => {
    it("returns new Locator with corrections", () => {
      const orig = Locator.css(".btn");
      const corrected = orig.withCorrections({ left: { value: 10, type: CorrectionType.PLUS } });
      expect(corrected.corrections?.left?.value).toBe(10);
      expect(corrected).not.toBe(orig);
    });

    it("preserves original locator unchanged", () => {
      const orig = Locator.css(".btn");
      orig.withCorrections({ left: { value: 5, type: CorrectionType.MINUS } });
      expect(orig.corrections).toBeUndefined();
    });
  });

  describe("withIndex", () => {
    it("returns new Locator with index", () => {
      expect(Locator.css(".item").withIndex(3).index).toBe(3);
    });
  });

  describe("withParent", () => {
    it("returns new Locator with parent", () => {
      const parent = Locator.css(".container");
      const child = Locator.css(".item").withParent(parent);
      expect(child.parent).toBe(parent);
    });
  });

  describe("prettyString", () => {
    it("formats simple CSS locator", () => {
      expect(Locator.css(".btn").prettyString()).toBe("css: .btn");
    });

    it("includes parent prefix when parent set", () => {
      const child = Locator.css(".item").withParent(Locator.css(".list"));
      expect(child.prettyString()).toBe("css: .list / css: .item");
    });

    it("includes [index] suffix when index > 0", () => {
      expect(Locator.css(".item").withIndex(2).prettyString()).toBe("css: .item[2]");
    });

    it("omits index suffix when index is 0", () => {
      expect(Locator.css(".item").prettyString()).not.toContain("[");
    });
  });

  describe("toPlaywrightSelector", () => {
    it("CSS returns value directly", () => {
      expect(Locator.css(".btn").toPlaywrightSelector()).toBe(".btn");
    });

    it('XPATH prepends "xpath="', () => {
      expect(Locator.xpath("//div").toPlaywrightSelector()).toBe("xpath=//div");
    });

    it("ID returns value directly", () => {
      expect(Locator.id("main").toPlaywrightSelector()).toBe("#main");
    });
  });
});

describe("applyCorrection", () => {
  it("returns original when correction is undefined", () => {
    expect(applyCorrection(undefined, 100)).toBe(100);
  });

  it("PLUS adds value", () => {
    expect(applyCorrection({ value: 10, type: CorrectionType.PLUS }, 100)).toBe(110);
  });

  it("MINUS subtracts value", () => {
    expect(applyCorrection({ value: 10, type: CorrectionType.MINUS }, 100)).toBe(90);
  });

  it("EQUALS replaces with correction value", () => {
    expect(applyCorrection({ value: 50, type: CorrectionType.EQUALS }, 100)).toBe(50);
  });
});
