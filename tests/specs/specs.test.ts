import { describe, it, expect } from "vitest";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Side } from "../../src/specs/side.js";
import { Location } from "../../src/specs/location.js";
import {
  SpecWidth, SpecHeight, SpecAbove, SpecBelow, SpecLeftOf, SpecRightOf,
  SpecInside, SpecNear, SpecOn, SpecCentered, SpecAligned, SpecHorizontally, SpecVertically,
  SpecText, SpecCss, SpecOcr, SpecImage, SpecColorScheme, SpecVisible, SpecAbsent,
  SpecCount, SpecContains, SpecComponent,
  Alignment, CenteredLocation, TextCheckType, CountFetchType,
} from "../../src/specs/specs.js";

const r100 = Range.exact(new RangeValue(100));
const loc = [new Location(r100, [Side.LEFT])];

describe("SpecWidth", () => {
  it("constructs with range", () => expect(new SpecWidth(r100).range).toBe(r100));
});

describe("SpecHeight", () => {
  it("constructs with range", () => expect(new SpecHeight(r100).range).toBe(r100));
});

describe("SpecAbove / SpecBelow / SpecLeftOf / SpecRightOf", () => {
  it("constructs with object and range", () => {
    expect(new SpecAbove("menu", r100).object).toBe("menu");
    expect(new SpecBelow("header", r100).range).toBe(r100);
    expect(new SpecLeftOf("sidebar", r100).object).toBe("sidebar");
    expect(new SpecRightOf("icon", r100).object).toBe("icon");
  });
});

describe("SpecInside", () => {
  it("constructs with object and locations", () => {
    const s = new SpecInside("container", loc);
    expect(s.object).toBe("container");
    expect(s.locations).toHaveLength(1);
  });

  it("partly defaults to false", () => {
    expect(new SpecInside("c", loc).partly).toBe(false);
  });

  it("withPartlyCheck sets partly to true", () => {
    const s = new SpecInside("c", loc).withPartlyCheck();
    expect(s.partly).toBe(true);
  });
});

describe("SpecNear", () => {
  it("constructs with object and locations", () => {
    expect(new SpecNear("btn", loc).object).toBe("btn");
  });
});

describe("SpecOn", () => {
  it("constructs with object, sides, and locations", () => {
    const s = new SpecOn("header", Side.LEFT, Side.TOP, loc);
    expect(s.sideHorizontal).toBe(Side.LEFT);
    expect(s.sideVertical).toBe(Side.TOP);
  });
});

describe("SpecCentered", () => {
  it("constructs with all params", () => {
    const s = new SpecCentered("box", Alignment.ALL, CenteredLocation.INSIDE, 3);
    expect(s.alignment).toBe(Alignment.ALL);
    expect(s.location).toBe(CenteredLocation.INSIDE);
    expect(s.errorRate).toBe(3);
  });
});

describe("SpecHorizontally / SpecVertically", () => {
  it("constructs with object, alignment, errorRate", () => {
    const h = new SpecHorizontally("btn", Alignment.TOP, 2);
    expect(h.alignment).toBe(Alignment.TOP);
    const v = new SpecVertically("btn", Alignment.LEFT, 0);
    expect(v.alignment).toBe(Alignment.LEFT);
  });
});

describe("SpecText", () => {
  it("constructs with type, text, operations", () => {
    const s = new SpecText(TextCheckType.IS, "hello", ["lowercase"]);
    expect(s.type).toBe(TextCheckType.IS);
    expect(s.text).toBe("hello");
    expect(s.operations).toEqual(["lowercase"]);
  });
});

describe("SpecCss", () => {
  it("constructs with cssPropertyName, type, text", () => {
    const s = new SpecCss("font-size", TextCheckType.IS, "14px");
    expect(s.cssPropertyName).toBe("font-size");
  });
});

describe("SpecOcr", () => {
  it("constructs with type, text", () => {
    expect(new SpecOcr(TextCheckType.CONTAINS, "abc").text).toBe("abc");
  });
});

describe("SpecImage", () => {
  it("has default empty values", () => {
    const s = new SpecImage();
    expect(s.imagePaths).toEqual([]);
    expect(s.stretch).toBe(false);
    expect(s.cropIfOutside).toBe(false);
    expect(s.analyzeOffset).toBe(0);
  });
});

describe("SpecColorScheme", () => {
  it("constructs with colorRanges", () => {
    const s = new SpecColorScheme([{ range: r100, colorHex: "#ff0000" }]);
    expect(s.colorRanges).toHaveLength(1);
  });
});

describe("SpecVisible / SpecAbsent", () => {
  it("constructs with no args", () => {
    expect(new SpecVisible()).toBeInstanceOf(SpecVisible);
    expect(new SpecAbsent()).toBeInstanceOf(SpecAbsent);
  });
});

describe("SpecCount", () => {
  it("constructs with fetchType, pattern, amount", () => {
    const s = new SpecCount(CountFetchType.ANY, "button*", r100);
    expect(s.fetchType).toBe(CountFetchType.ANY);
    expect(s.pattern).toBe("button*");
  });
});

describe("SpecContains", () => {
  it("constructs with childObjects and partly flag", () => {
    const s = new SpecContains(["a", "b"], true);
    expect(s.childObjects).toEqual(["a", "b"]);
    expect(s.partly).toBe(true);
  });
});

describe("SpecComponent", () => {
  it("constructs with specPath, frame, args", () => {
    const s = new SpecComponent("login.gspec", true, { width: 100 });
    expect(s.specPath).toBe("login.gspec");
    expect(s.frame).toBe(true);
    expect(s.args).toEqual({ width: 100 });
  });
});
