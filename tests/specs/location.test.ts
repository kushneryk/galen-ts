import { describe, it, expect } from "vitest";
import { Location } from "../../src/specs/location.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Side } from "../../src/specs/side.js";

describe("Location", () => {
  it("constructs with range and sides", () => {
    const loc = new Location(Range.exact(new RangeValue(10)), [Side.LEFT]);
    expect(loc.range).toBeDefined();
    expect(loc.sides).toEqual([Side.LEFT]);
  });

  it("toString formats range and sides", () => {
    const loc = new Location(Range.exact(new RangeValue(10)), [Side.LEFT, Side.TOP]);
    expect(loc.toString()).toContain("left");
  });

  it("static locations() returns array", () => {
    const a = new Location(Range.exact(new RangeValue(5)), [Side.TOP]);
    const b = new Location(Range.exact(new RangeValue(10)), [Side.LEFT]);
    expect(Location.locations(a, b)).toHaveLength(2);
  });
});
