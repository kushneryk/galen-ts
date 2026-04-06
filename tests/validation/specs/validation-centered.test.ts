import { describe, it, expect } from "vitest";
import { SpecCentered, Alignment, CenteredLocation } from "../../../src/specs/specs.js";
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

describe("SpecValidationCentered", () => {
  it("passes for centered INSIDE with equal margins", async () => {
    // child(25,25,50,50) inside parent(0,0,100,100) — 25px margin on all sides
    const pv = setup(new Rect(25, 25, 50, 50), new Rect(0, 0, 100, 100));
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeUndefined();
  });

  it("fails when horizontal offset exceeds errorRate", async () => {
    // child(30,25,50,50) — left margin 30, right margin 20 → offset 10
    const pv = setup(new Rect(30, 25, 50, 50), new Rect(0, 0, 100, 100));
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeDefined();
  });

  it("fails when vertical offset exceeds errorRate", async () => {
    // child(25,30,50,50) — top margin 30, bottom margin 20 → offset 10
    const pv = setup(new Rect(25, 30, 50, 50), new Rect(0, 0, 100, 100));
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeDefined();
  });

  it("tolerates offset within errorRate", async () => {
    // child(24,25,50,50) — left=24, right=26 → offset 2, errorRate 2
    const pv = setup(new Rect(24, 25, 50, 50), new Rect(0, 0, 100, 100));
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeUndefined();
  });

  it("ON location inverts offset calculation", async () => {
    // child(0,0,200,200) centered ON parent(50,50,100,100)
    // Same center point (100,100), offsets are -50 each, inverted to 50 each, equal → pass
    const pv = setup(new Rect(0, 0, 200, 200), new Rect(50, 50, 100, 100));
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.ON, 2));
    expect(r.error).toBeUndefined();
  });
});
