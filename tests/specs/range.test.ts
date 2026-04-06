import { describe, it, expect } from "vitest";
import { RangeValue, Range, RangeType } from "../../src/specs/range.js";

describe("RangeValue", () => {
  describe("parse", () => {
    it("parses integer string", () => {
      const v = RangeValue.parse("100");
      expect(v.asInt()).toBe(100);
      expect(v.precision).toBe(0);
    });

    it("parses float string with correct precision", () => {
      const v = RangeValue.parse("12.5");
      expect(v.asDouble()).toBe(12.5);
      expect(v.precision).toBe(1);
    });

    it("parses float with two decimal places", () => {
      const v = RangeValue.parse("99.75");
      expect(v.asDouble()).toBe(99.75);
      expect(v.precision).toBe(2);
    });

    it("parses negative number", () => {
      const v = RangeValue.parse("-10");
      expect(v.asInt()).toBe(-10);
    });
  });

  describe("asInt", () => {
    it("rounds to nearest integer", () => {
      const v = new RangeValue(10.6);
      expect(v.asInt()).toBe(11);
    });
  });

  describe("asDouble", () => {
    it("returns exact float value", () => {
      const v = new RangeValue(3.14);
      expect(v.asDouble()).toBe(3.14);
    });
  });

  describe("comparisons", () => {
    const a = new RangeValue(10);
    const b = new RangeValue(20);
    const c = new RangeValue(10);

    it("isLessThan returns true when less", () => {
      expect(a.isLessThan(b)).toBe(true);
    });

    it("isLessThan returns false when equal", () => {
      expect(a.isLessThan(c)).toBe(false);
    });

    it("isGreaterThan returns true when greater", () => {
      expect(b.isGreaterThan(a)).toBe(true);
    });

    it("isGreaterThanOrEquals returns true when equal", () => {
      expect(a.isGreaterThanOrEquals(c)).toBe(true);
    });

    it("isLessThanOrEquals returns true when equal", () => {
      expect(a.isLessThanOrEquals(c)).toBe(true);
    });

    it("isEquals returns true for same value", () => {
      expect(a.isEquals(c)).toBe(true);
    });

    it("isEquals returns false for different values", () => {
      expect(a.isEquals(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("renders integer without decimals", () => {
      expect(new RangeValue(42).toString()).toBe("42");
    });

    it("renders float with correct decimal places", () => {
      expect(new RangeValue(3.14, 2).toString()).toBe("3.14");
    });
  });
});

describe("Range", () => {
  describe("holds", () => {
    it("EXACT: holds for matching value", () => {
      expect(Range.exact(new RangeValue(100)).holds(100)).toBe(true);
    });

    it("EXACT: rejects non-matching value", () => {
      expect(Range.exact(new RangeValue(100)).holds(101)).toBe(false);
    });

    it("BETWEEN: holds for value in range", () => {
      expect(Range.between(new RangeValue(10), new RangeValue(20)).holds(15)).toBe(true);
    });

    it("BETWEEN: rejects value below range", () => {
      expect(Range.between(new RangeValue(10), new RangeValue(20)).holds(5)).toBe(false);
    });

    it("BETWEEN: rejects value above range", () => {
      expect(Range.between(new RangeValue(10), new RangeValue(20)).holds(25)).toBe(false);
    });

    it("BETWEEN: holds at boundaries", () => {
      const r = Range.between(new RangeValue(10), new RangeValue(20));
      expect(r.holds(10)).toBe(true);
      expect(r.holds(20)).toBe(true);
    });

    it("GREATER_THAN: holds for value above", () => {
      expect(Range.greaterThan(new RangeValue(5)).holds(10)).toBe(true);
    });

    it("GREATER_THAN: rejects equal value", () => {
      expect(Range.greaterThan(new RangeValue(5)).holds(5)).toBe(false);
    });

    it("LESS_THAN: holds for value below", () => {
      expect(Range.lessThan(new RangeValue(100)).holds(50)).toBe(true);
    });

    it("LESS_THAN: rejects equal value", () => {
      expect(Range.lessThan(new RangeValue(100)).holds(100)).toBe(false);
    });

    it("GREATER_THAN_OR_EQUALS: holds for equal value", () => {
      expect(Range.greaterThanOrEquals(new RangeValue(5)).holds(5)).toBe(true);
    });

    it("LESS_THAN_OR_EQUALS: holds for equal value", () => {
      expect(Range.lessThanOrEquals(new RangeValue(50)).holds(50)).toBe(true);
    });
  });

  describe("prettyString", () => {
    it("formats exact with px suffix", () => {
      expect(Range.exact(new RangeValue(100)).prettyString()).toBe("100px");
    });

    it("formats between with to separator", () => {
      expect(Range.between(new RangeValue(10), new RangeValue(20)).prettyString()).toBe("10 to 20px");
    });

    it("formats > with gt symbol", () => {
      expect(Range.greaterThan(new RangeValue(5)).prettyString()).toBe("> 5px");
    });

    it("formats >= with gte symbol", () => {
      expect(Range.greaterThanOrEquals(new RangeValue(0)).prettyString()).toBe(">= 0px");
    });

    it("formats < with lt symbol", () => {
      expect(Range.lessThan(new RangeValue(100)).prettyString()).toBe("< 100px");
    });

    it("formats <= with lte symbol", () => {
      expect(Range.lessThanOrEquals(new RangeValue(50)).prettyString()).toBe("<= 50px");
    });

    it("formats percentage with % of objectName", () => {
      const r = Range.exact(new RangeValue(50)).withPercentageOf("viewport/width");
      expect(r.prettyString()).toBe("50% of viewport/width");
    });
  });

  describe("getErrorMessageSuffix", () => {
    it("returns px for non-percentage", () => {
      expect(Range.exact(new RangeValue(10)).getErrorMessageSuffix()).toBe("px");
    });

    it("returns % of name/px for percentage", () => {
      const r = Range.exact(new RangeValue(50)).withPercentageOf("menu");
      expect(r.getErrorMessageSuffix()).toBe("% of menu/px");
    });
  });

  describe("factories", () => {
    it("exact creates EXACT range", () => {
      expect(Range.exact(new RangeValue(1)).rangeType).toBe(RangeType.EXACT);
    });

    it("between creates BETWEEN range", () => {
      expect(Range.between(new RangeValue(1), new RangeValue(2)).rangeType).toBe(RangeType.BETWEEN);
    });

    it("greaterThan creates GREATER_THAN range", () => {
      expect(Range.greaterThan(new RangeValue(1)).rangeType).toBe(RangeType.GREATER_THAN);
    });

    it("lessThan creates LESS_THAN range", () => {
      expect(Range.lessThan(new RangeValue(1)).rangeType).toBe(RangeType.LESS_THAN);
    });

    it("greaterThanOrEquals creates GREATER_THAN_OR_EQUALS range", () => {
      expect(Range.greaterThanOrEquals(new RangeValue(1)).rangeType).toBe(RangeType.GREATER_THAN_OR_EQUALS);
    });

    it("lessThanOrEquals creates LESS_THAN_OR_EQUALS range", () => {
      expect(Range.lessThanOrEquals(new RangeValue(1)).rangeType).toBe(RangeType.LESS_THAN_OR_EQUALS);
    });
  });

  describe("withPercentageOf", () => {
    it("creates new Range with percentageOfValue set", () => {
      const r = Range.exact(new RangeValue(50)).withPercentageOf("screen/width");
      expect(r.percentageOfValue).toBe("screen/width");
    });

    it("isPercentage returns true", () => {
      const r = Range.exact(new RangeValue(50)).withPercentageOf("obj");
      expect(r.isPercentage()).toBe(true);
    });

    it("isPercentage returns false for non-percentage", () => {
      expect(Range.exact(new RangeValue(50)).isPercentage()).toBe(false);
    });
  });
});
