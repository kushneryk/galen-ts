import { describe, it, expect } from "vitest";
import { SpecNear } from "../../../src/specs/specs.js";
import { Range, RangeValue } from "../../../src/specs/range.js";
import { Location } from "../../../src/specs/location.js";
import { Side } from "../../../src/specs/side.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

function setup(mainRect: Rect, otherRect: Rect) {
  const ps = new PageSpec();
  ps.addObject("main", Locator.css(".m"));
  ps.addObject("other", Locator.css(".o"));
  return buildPageValidation(
    { main: { rect: mainRect }, other: { rect: otherRect } },
    ps,
  );
}

describe("SpecValidationNear", () => {
  it("passes when proximity matches range", async () => {
    // main is left of other: main.RIGHT=40, other.LEFT=50, gap=10 on left side
    // near LEFT: firstEdge=RIGHT, secondEdge=LEFT, inverted → -(40-50) = 10
    const pv = setup(new Rect(0, 0, 40, 50), new Rect(50, 0, 50, 50));
    const spec = new SpecNear("other", [
      new Location(Range.exact(new RangeValue(10)), [Side.LEFT]),
    ]);
    const r = await pv.check("main", spec);
    expect(r.error).toBeUndefined();
  });

  it("fails when proximity is outside range", async () => {
    const pv = setup(new Rect(0, 0, 40, 50), new Rect(50, 0, 50, 50));
    const spec = new SpecNear("other", [
      new Location(Range.exact(new RangeValue(5)), [Side.LEFT]),
    ]);
    const r = await pv.check("main", spec);
    expect(r.error).toBeDefined();
  });
});
