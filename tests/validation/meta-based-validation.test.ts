import { describe, it, expect } from "vitest";
import { MetaBasedValidation } from "../../src/validation/meta-based-validation.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Side } from "../../src/specs/side.js";
import { Rect } from "../../src/page/rect.js";
import { PageValidation } from "../../src/validation/page-validation.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { mockPage } from "../helpers/mock-page-element.js";

const pv = new PageValidation(mockPage({}), new PageSpec());

describe("MetaBasedValidation", () => {
  it("validates passing range", () => {
    const r = MetaBasedValidation.forObjects("a", "b", Range.exact(new RangeValue(10)))
      .withBothEdges(Side.LEFT)
      .validate(new Rect(20, 0, 10, 10), new Rect(10, 0, 10, 10), pv, "left");
    expect(r.error).toBeUndefined();
  });

  it("returns error for failing range", () => {
    const r = MetaBasedValidation.forObjects("a", "b", Range.exact(new RangeValue(5)))
      .withBothEdges(Side.LEFT)
      .validate(new Rect(20, 0, 10, 10), new Rect(10, 0, 10, 10), pv, "left");
    expect(r.error).toBeDefined();
  });

  it("computes offset using configured edges", () => {
    // a.RIGHT(30) - b.LEFT(50) = -20
    const r = MetaBasedValidation.forObjects("a", "b", Range.exact(new RangeValue(-20)))
      .withFirstEdge(Side.RIGHT)
      .withSecondEdge(Side.LEFT)
      .validate(new Rect(10, 0, 20, 10), new Rect(50, 0, 10, 10), pv, "test");
    expect(r.error).toBeUndefined();
  });

  it("applies inverted calculation", () => {
    // Without inversion: a.BOTTOM(10) - b.TOP(20) = -10
    // With inversion: -(-10) = 10
    const r = MetaBasedValidation.forObjects("a", "b", Range.exact(new RangeValue(10)))
      .withFirstEdge(Side.BOTTOM)
      .withSecondEdge(Side.TOP)
      .withInvertedCalculation(true)
      .validate(new Rect(0, 0, 10, 10), new Rect(0, 20, 10, 10), pv, "above");
    expect(r.error).toBeUndefined();
  });

  it("generates correct meta key/value", () => {
    const r = MetaBasedValidation.forObjects("header", "menu", Range.exact(new RangeValue(0)))
      .withBothEdges(Side.LEFT)
      .validate(new Rect(0, 0, 10, 10), new Rect(0, 0, 10, 10), pv, "left");
    expect(r.meta.key).toBe("header/left");
    expect(r.meta.value).toContain("px");
  });

  it("withBothEdges sets both first and second edge", () => {
    // a.TOP(5) - b.TOP(5) = 0
    const r = MetaBasedValidation.forObjects("a", "b", Range.exact(new RangeValue(0)))
      .withBothEdges(Side.TOP)
      .validate(new Rect(0, 5, 10, 10), new Rect(0, 5, 10, 10), pv, "top");
    expect(r.error).toBeUndefined();
  });
});
