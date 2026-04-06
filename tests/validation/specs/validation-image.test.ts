import { describe, it, expect, afterEach } from "vitest";
import { SpecImage, ErrorRateType } from "../../../src/specs/specs.js";
import { setImageComparator } from "../../../src/validation/specs/validation-image.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

describe("SpecValidationImage", () => {
  afterEach(() => {
    // Reset comparator
    setImageComparator(null as any);
  });

  it("throws when no comparator is registered", async () => {
    const ps = new PageSpec();
    ps.addObject("el", Locator.css(".el"));
    const pv = buildPageValidation({ el: { rect: new Rect(0, 0, 100, 50) } }, ps);
    const spec = new SpecImage();
    spec.imagePaths = ["test.png"];
    const r = await pv.check("el", spec);
    expect(r.error).toBeDefined();
    expect(r.error!.messages[0]).toContain("comparator");
  });
});
