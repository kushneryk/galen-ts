import { describe, it, expect } from "vitest";
import { SpecHorizontally, SpecVertically, Alignment } from "../../../src/specs/specs.js";
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

describe("SpecValidationHorizontally", () => {
  it("passes for TOP alignment", async () => {
    const pv = setup(new Rect(0, 10, 50, 30), new Rect(100, 10, 50, 40));
    const r = await pv.check("main", new SpecHorizontally("other", Alignment.TOP, 0));
    expect(r.error).toBeUndefined();
  });

  it("passes for BOTTOM alignment", async () => {
    const pv = setup(new Rect(0, 10, 50, 40), new Rect(100, 20, 50, 30));
    // main bottom=50, other bottom=50
    const r = await pv.check("main", new SpecHorizontally("other", Alignment.BOTTOM, 0));
    expect(r.error).toBeUndefined();
  });

  it("passes for CENTERED alignment", async () => {
    // main center: 10 + 30/2 = 25, other center: 10 + 30/2 = 25
    const pv = setup(new Rect(0, 10, 50, 30), new Rect(100, 10, 50, 30));
    const r = await pv.check("main", new SpecHorizontally("other", Alignment.CENTERED, 0));
    expect(r.error).toBeUndefined();
  });

  it("fails when offset exceeds errorRate", async () => {
    // main top=10, other top=20 → offset 10
    const pv = setup(new Rect(0, 10, 50, 30), new Rect(100, 20, 50, 30));
    const r = await pv.check("main", new SpecHorizontally("other", Alignment.TOP, 5));
    expect(r.error).toBeDefined();
  });
});

describe("SpecValidationVertically", () => {
  it("passes for LEFT alignment", async () => {
    const pv = setup(new Rect(10, 0, 50, 30), new Rect(10, 100, 50, 30));
    const r = await pv.check("main", new SpecVertically("other", Alignment.LEFT, 0));
    expect(r.error).toBeUndefined();
  });

  it("passes for RIGHT alignment", async () => {
    // main right=60, other right=60
    const pv = setup(new Rect(10, 0, 50, 30), new Rect(10, 100, 50, 30));
    const r = await pv.check("main", new SpecVertically("other", Alignment.RIGHT, 0));
    expect(r.error).toBeUndefined();
  });

  it("passes for CENTERED alignment", async () => {
    const pv = setup(new Rect(10, 0, 50, 30), new Rect(10, 100, 50, 30));
    const r = await pv.check("main", new SpecVertically("other", Alignment.CENTERED, 0));
    expect(r.error).toBeUndefined();
  });

  it("fails when offset exceeds errorRate", async () => {
    const pv = setup(new Rect(10, 0, 50, 30), new Rect(30, 100, 50, 30));
    const r = await pv.check("main", new SpecVertically("other", Alignment.LEFT, 5));
    expect(r.error).toBeDefined();
  });
});
