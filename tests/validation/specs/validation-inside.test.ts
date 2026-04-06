import { describe, it, expect } from "vitest";
import { SpecInside } from "../../../src/specs/specs.js";
import { Range, RangeValue } from "../../../src/specs/range.js";
import { Location } from "../../../src/specs/location.js";
import { Side } from "../../../src/specs/side.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

function setup(childRect: Rect, parentRect: Rect) {
  const ps = new PageSpec();
  ps.addObject("child", Locator.css(".c"));
  ps.addObject("parent", Locator.css(".p"));
  return buildPageValidation(
    { child: { rect: childRect }, parent: { rect: parentRect } },
    ps,
  );
}

describe("SpecValidationInside", () => {
  it("passes when completely inside", async () => {
    // child(10,10,80,80) inside parent(0,0,100,100), all margins=10
    const pv = setup(new Rect(10, 10, 80, 80), new Rect(0, 0, 100, 100));
    const spec = new SpecInside("parent", [
      new Location(Range.exact(new RangeValue(10)), [Side.LEFT, Side.TOP, Side.RIGHT, Side.BOTTOM]),
    ]);
    const r = await pv.check("child", spec);
    expect(r.error).toBeUndefined();
  });

  it("fails when not completely inside (offset > 2px)", async () => {
    // child extends outside parent
    const pv = setup(new Rect(-10, 10, 80, 80), new Rect(0, 0, 100, 100));
    const spec = new SpecInside("parent", [
      new Location(Range.exact(new RangeValue(10)), [Side.LEFT]),
    ]);
    const r = await pv.check("child", spec);
    expect(r.error).toBeDefined();
  });

  it("skips containment check in partly mode", async () => {
    // child partly outside, but partly mode doesn't check containment
    const pv = setup(new Rect(-5, 10, 50, 50), new Rect(0, 0, 100, 100));
    const spec = new SpecInside("parent", [
      new Location(Range.greaterThanOrEquals(new RangeValue(0)), [Side.TOP]),
    ]).withPartlyCheck();
    const r = await pv.check("child", spec);
    expect(r.error).toBeUndefined();
  });

  it("validates per-side offset against location range", async () => {
    // child(20,20,60,60) inside parent(0,0,100,100), left margin=20
    const pv = setup(new Rect(20, 20, 60, 60), new Rect(0, 0, 100, 100));
    const spec = new SpecInside("parent", [
      new Location(Range.exact(new RangeValue(20)), [Side.LEFT]),
    ]);
    const r = await pv.check("child", spec);
    expect(r.error).toBeUndefined();
  });

  it("fails for incorrect side offset", async () => {
    const pv = setup(new Rect(20, 20, 60, 60), new Rect(0, 0, 100, 100));
    const spec = new SpecInside("parent", [
      new Location(Range.exact(new RangeValue(10)), [Side.LEFT]),
    ]);
    const r = await pv.check("child", spec);
    expect(r.error).toBeDefined();
  });
});
