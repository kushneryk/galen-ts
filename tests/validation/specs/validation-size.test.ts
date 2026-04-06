import { describe, it, expect } from "vitest";
import { SpecWidth, SpecHeight } from "../../../src/specs/specs.js";
import { Range, RangeValue } from "../../../src/specs/range.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

function setup(rect: Rect) {
  const ps = new PageSpec();
  ps.addObject("obj", Locator.css(".x"));
  return buildPageValidation({ obj: { rect } }, ps);
}

describe("SpecValidationWidth", () => {
  it("passes when width matches exact range", async () => {
    const pv = setup(new Rect(0, 0, 100, 50));
    const r = await pv.check("obj", new SpecWidth(Range.exact(new RangeValue(100))));
    expect(r.error).toBeUndefined();
  });

  it("fails when width is outside range", async () => {
    const pv = setup(new Rect(0, 0, 120, 50));
    const r = await pv.check("obj", new SpecWidth(Range.exact(new RangeValue(100))));
    expect(r.error).toBeDefined();
  });
});

describe("SpecValidationHeight", () => {
  it("passes when height matches exact range", async () => {
    const pv = setup(new Rect(0, 0, 100, 50));
    const r = await pv.check("obj", new SpecHeight(Range.exact(new RangeValue(50))));
    expect(r.error).toBeUndefined();
  });

  it("fails when height is outside range", async () => {
    const pv = setup(new Rect(0, 0, 100, 80));
    const r = await pv.check("obj", new SpecHeight(Range.exact(new RangeValue(50))));
    expect(r.error).toBeDefined();
  });
});
