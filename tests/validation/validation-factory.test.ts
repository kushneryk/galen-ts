import { describe, it, expect } from "vitest";
import { getValidation } from "../../src/validation/validation-factory.js";
import {
  SpecWidth, SpecHeight, SpecAbove, SpecBelow, SpecLeftOf, SpecRightOf,
  SpecInside, SpecNear, SpecContains, SpecCentered, SpecHorizontally, SpecVertically,
  SpecText, SpecCss, SpecVisible, SpecAbsent, SpecCount, SpecComponent, SpecImage,
  Alignment, CenteredLocation, TextCheckType, CountFetchType,
} from "../../src/specs/specs.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Location } from "../../src/specs/location.js";
import { Side } from "../../src/specs/side.js";
import { Spec } from "../../src/specs/spec.js";

const r = Range.exact(new RangeValue(10));
const loc = [new Location(r, [Side.LEFT])];

describe("getValidation", () => {
  const cases: [string, Spec][] = [
    ["SpecWidth", new SpecWidth(r)],
    ["SpecHeight", new SpecHeight(r)],
    ["SpecAbove", new SpecAbove("x", r)],
    ["SpecBelow", new SpecBelow("x", r)],
    ["SpecLeftOf", new SpecLeftOf("x", r)],
    ["SpecRightOf", new SpecRightOf("x", r)],
    ["SpecInside", new SpecInside("x", loc)],
    ["SpecNear", new SpecNear("x", loc)],
    ["SpecContains", new SpecContains(["x"])],
    ["SpecCentered", new SpecCentered("x", Alignment.ALL, CenteredLocation.ON)],
    ["SpecHorizontally", new SpecHorizontally("x", Alignment.TOP)],
    ["SpecVertically", new SpecVertically("x", Alignment.LEFT)],
    ["SpecText", new SpecText(TextCheckType.IS, "x")],
    ["SpecCss", new SpecCss("color", TextCheckType.IS, "red")],
    ["SpecVisible", new SpecVisible()],
    ["SpecAbsent", new SpecAbsent()],
    ["SpecCount", new SpecCount(CountFetchType.ANY, "*", r)],
    ["SpecComponent", new SpecComponent("f.gspec")],
    ["SpecImage", new SpecImage()],
  ];

  for (const [name, spec] of cases) {
    it(`returns validator for ${name}`, () => {
      expect(getValidation(spec)).toBeDefined();
    });
  }

  it("throws for unregistered spec type", () => {
    class FakeSpec extends Spec {}
    expect(() => getValidation(new FakeSpec())).toThrow("No validation registered");
  });
});
