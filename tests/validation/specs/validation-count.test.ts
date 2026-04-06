import { describe, it, expect } from "vitest";
import { SpecCount, CountFetchType } from "../../../src/specs/specs.js";
import { Range, RangeValue } from "../../../src/specs/range.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

describe("SpecValidationCount", () => {
  it("ANY: passes when count matches range", async () => {
    const ps = new PageSpec();
    ps.addObject("btn-1", Locator.css(".b1"));
    ps.addObject("btn-2", Locator.css(".b2"));
    const pv = buildPageValidation({
      "btn-1": { rect: new Rect(0, 0, 10, 10) },
      "btn-2": { rect: new Rect(0, 0, 10, 10) },
    }, ps);
    const r = await pv.check("x", new SpecCount(CountFetchType.ANY, "btn-*", Range.exact(new RangeValue(2))));
    expect(r.error).toBeUndefined();
  });

  it("ANY: fails when count does not match", async () => {
    const ps = new PageSpec();
    ps.addObject("btn-1", Locator.css(".b1"));
    const pv = buildPageValidation({ "btn-1": { rect: new Rect(0, 0, 10, 10) } }, ps);
    const r = await pv.check("x", new SpecCount(CountFetchType.ANY, "btn-*", Range.exact(new RangeValue(5))));
    expect(r.error).toBeDefined();
  });

  it("VISIBLE: counts only present+visible elements", async () => {
    const ps = new PageSpec();
    ps.addObject("btn-1", Locator.css(".b1"));
    ps.addObject("btn-2", Locator.css(".b2"));
    const pv = buildPageValidation({
      "btn-1": { rect: new Rect(0, 0, 10, 10) },
      "btn-2": { rect: new Rect(0, 0, 10, 10), visible: false },
    }, ps);
    const r = await pv.check("x", new SpecCount(CountFetchType.VISIBLE, "btn-*", Range.exact(new RangeValue(1))));
    expect(r.error).toBeUndefined();
  });

  it("ABSENT: counts absent or invisible elements", async () => {
    const ps = new PageSpec();
    ps.addObject("btn-1", Locator.css(".b1"));
    ps.addObject("btn-2", Locator.css(".b2"));
    const pv = buildPageValidation({
      "btn-1": { rect: new Rect(0, 0, 10, 10) },
      "btn-2": { rect: new Rect(0, 0, 10, 10), present: false },
    }, ps);
    const r = await pv.check("x", new SpecCount(CountFetchType.ABSENT, "btn-*", Range.exact(new RangeValue(1))));
    expect(r.error).toBeUndefined();
  });
});
