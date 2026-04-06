import { describe, it, expect } from "vitest";
import { SpecAbove, SpecBelow, SpecLeftOf, SpecRightOf } from "../../../src/specs/specs.js";
import { Range, RangeValue } from "../../../src/specs/range.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

function setup(mainRect: Rect, secondRect: Rect) {
  const ps = new PageSpec();
  ps.addObject("main", Locator.css(".m"));
  ps.addObject("other", Locator.css(".o"));
  return buildPageValidation(
    { main: { rect: mainRect }, other: { rect: secondRect } },
    ps,
  );
}

describe("above", () => {
  it("passes when object is above other by correct px", async () => {
    // main bottom=50, other top=60, gap=10
    const pv = setup(new Rect(0, 0, 100, 50), new Rect(0, 60, 100, 50));
    const r = await pv.check("main", new SpecAbove("other", Range.exact(new RangeValue(10))));
    expect(r.error).toBeUndefined();
  });

  it("fails when gap is wrong", async () => {
    const pv = setup(new Rect(0, 0, 100, 50), new Rect(0, 60, 100, 50));
    const r = await pv.check("main", new SpecAbove("other", Range.exact(new RangeValue(5))));
    expect(r.error).toBeDefined();
  });
});

describe("below", () => {
  it("passes for correct gap below", async () => {
    // main top=60, other bottom=50, gap=10
    const pv = setup(new Rect(0, 60, 100, 50), new Rect(0, 0, 100, 50));
    const r = await pv.check("main", new SpecBelow("other", Range.exact(new RangeValue(10))));
    expect(r.error).toBeUndefined();
  });
});

describe("left-of", () => {
  it("passes when object is to the left", async () => {
    // main right=50, other left=60, gap=10
    const pv = setup(new Rect(0, 0, 50, 100), new Rect(60, 0, 50, 100));
    const r = await pv.check("main", new SpecLeftOf("other", Range.exact(new RangeValue(10))));
    expect(r.error).toBeUndefined();
  });
});

describe("right-of", () => {
  it("passes when object is to the right", async () => {
    // main left=60, other right=50, gap=10
    const pv = setup(new Rect(60, 0, 50, 100), new Rect(0, 0, 50, 100));
    const r = await pv.check("main", new SpecRightOf("other", Range.exact(new RangeValue(10))));
    expect(r.error).toBeUndefined();
  });

  it("fails when gap is wrong", async () => {
    const pv = setup(new Rect(60, 0, 50, 100), new Rect(0, 0, 50, 100));
    const r = await pv.check("main", new SpecRightOf("other", Range.exact(new RangeValue(20))));
    expect(r.error).toBeDefined();
  });
});
