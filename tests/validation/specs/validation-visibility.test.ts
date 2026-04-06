import { describe, it, expect } from "vitest";
import { SpecVisible, SpecAbsent } from "../../../src/specs/specs.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

describe("SpecValidationVisible", () => {
  it("passes when element is present and visible", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50) } }, ps);
    const r = await pv.check("btn", new SpecVisible());
    expect(r.error).toBeUndefined();
  });

  it("fails when element is not present", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 0, 0), present: false } }, ps);
    const r = await pv.check("btn", new SpecVisible());
    expect(r.error).toBeDefined();
  });

  it("fails when element is present but not visible", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50), visible: false } }, ps);
    const r = await pv.check("btn", new SpecVisible());
    expect(r.error).toBeDefined();
  });
});

describe("SpecValidationAbsent", () => {
  it("passes when element is not present", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 0, 0), present: false } }, ps);
    const r = await pv.check("btn", new SpecAbsent());
    expect(r.error).toBeUndefined();
  });

  it("passes when element is present but not visible", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50), visible: false } }, ps);
    const r = await pv.check("btn", new SpecAbsent());
    expect(r.error).toBeUndefined();
  });

  it("fails when element is present and visible", async () => {
    const ps = new PageSpec();
    ps.addObject("btn", Locator.css(".btn"));
    const pv = buildPageValidation({ btn: { rect: new Rect(0, 0, 100, 50) } }, ps);
    const r = await pv.check("btn", new SpecAbsent());
    expect(r.error).toBeDefined();
  });
});
