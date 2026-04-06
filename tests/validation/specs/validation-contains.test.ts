import { describe, it, expect } from "vitest";
import { SpecContains } from "../../../src/specs/specs.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

describe("SpecValidationContains", () => {
  it("passes when all corners of child inside parent", async () => {
    const ps = new PageSpec();
    ps.addObject("parent", Locator.css(".p"));
    ps.addObject("child", Locator.css(".c"));
    const pv = buildPageValidation({
      parent: { rect: new Rect(0, 0, 200, 200) },
      child: { rect: new Rect(10, 10, 50, 50) },
    }, ps);
    const r = await pv.check("parent", new SpecContains(["child"]));
    expect(r.error).toBeUndefined();
  });

  it("fails when child is outside parent", async () => {
    const ps = new PageSpec();
    ps.addObject("parent", Locator.css(".p"));
    ps.addObject("child", Locator.css(".c"));
    const pv = buildPageValidation({
      parent: { rect: new Rect(0, 0, 50, 50) },
      child: { rect: new Rect(100, 100, 50, 50) },
    }, ps);
    const r = await pv.check("parent", new SpecContains(["child"]));
    expect(r.error).toBeDefined();
  });

  it("partly mode passes when at least one corner inside", async () => {
    const ps = new PageSpec();
    ps.addObject("parent", Locator.css(".p"));
    ps.addObject("child", Locator.css(".c"));
    const pv = buildPageValidation({
      parent: { rect: new Rect(0, 0, 50, 50) },
      child: { rect: new Rect(40, 40, 50, 50) }, // overlapping
    }, ps);
    const r = await pv.check("parent", new SpecContains(["child"], true));
    expect(r.error).toBeUndefined();
  });

  it("reports error for absent child", async () => {
    const ps = new PageSpec();
    ps.addObject("parent", Locator.css(".p"));
    ps.addObject("child", Locator.css(".c"));
    const pv = buildPageValidation({
      parent: { rect: new Rect(0, 0, 100, 100) },
      child: { rect: new Rect(0, 0, 0, 0), present: false },
    }, ps);
    const r = await pv.check("parent", new SpecContains(["child"]));
    expect(r.error).toBeDefined();
  });
});
