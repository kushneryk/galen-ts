import { describe, it, expect } from "vitest";
import { SpecReader } from "../../src/parser/spec-reader.js";
import {
  SpecWidth, SpecHeight, SpecAbove, SpecBelow, SpecLeftOf, SpecRightOf,
  SpecInside, SpecNear, SpecContains, SpecCentered, SpecHorizontally, SpecVertically,
  SpecText, SpecCss, SpecOcr, SpecVisible, SpecAbsent, SpecCount, SpecImage, SpecComponent,
  Alignment, CenteredLocation, TextCheckType, CountFetchType, ErrorRateType,
} from "../../src/specs/specs.js";
import { RangeType } from "../../src/specs/range.js";

const reader = new SpecReader();

describe("SpecReader", () => {
  describe("width / height", () => {
    it('parses "width 100px"', () => {
      const s = reader.read("width 100px") as SpecWidth;
      expect(s).toBeInstanceOf(SpecWidth);
      expect(s.range.rangeType).toBe(RangeType.EXACT);
      expect(s.range.from!.asInt()).toBe(100);
    });

    it('parses "height 10 to 20px"', () => {
      const s = reader.read("height 10 to 20px") as SpecHeight;
      expect(s).toBeInstanceOf(SpecHeight);
      expect(s.range.rangeType).toBe(RangeType.BETWEEN);
    });

    it('parses "width >= 0px"', () => {
      const s = reader.read("width >= 0px") as SpecWidth;
      expect(s.range.rangeType).toBe(RangeType.GREATER_THAN_OR_EQUALS);
    });
  });

  describe("above / below / left-of / right-of", () => {
    it('parses "above header 10px"', () => {
      const s = reader.read("above header 10px") as SpecAbove;
      expect(s).toBeInstanceOf(SpecAbove);
      expect(s.object).toBe("header");
      expect(s.range.from!.asInt()).toBe(10);
    });

    it('parses "below footer" with default >= 0px', () => {
      const s = reader.read("below footer") as SpecBelow;
      expect(s.range.rangeType).toBe(RangeType.GREATER_THAN_OR_EQUALS);
      expect(s.range.from!.asInt()).toBe(0);
    });

    it('parses "left-of sidebar 5 to 15px"', () => {
      const s = reader.read("left-of sidebar 5 to 15px") as SpecLeftOf;
      expect(s).toBeInstanceOf(SpecLeftOf);
      expect(s.range.rangeType).toBe(RangeType.BETWEEN);
    });

    it('parses "right-of menu > 0px"', () => {
      const s = reader.read("right-of menu > 0px") as SpecRightOf;
      expect(s).toBeInstanceOf(SpecRightOf);
      expect(s.range.rangeType).toBe(RangeType.GREATER_THAN);
    });
  });

  describe("inside", () => {
    it('parses "inside container 10px top"', () => {
      const s = reader.read("inside container 10px top") as SpecInside;
      expect(s).toBeInstanceOf(SpecInside);
      expect(s.object).toBe("container");
      expect(s.locations).toHaveLength(1);
    });

    it('parses "inside partly parent 0px left"', () => {
      const s = reader.read("inside partly parent 0px left") as SpecInside;
      expect(s.partly).toBe(true);
    });

    it("parses multiple locations", () => {
      const s = reader.read("inside box 10px top, 5px left") as SpecInside;
      expect(s.locations).toHaveLength(2);
    });
  });

  describe("near", () => {
    it('parses "near button 5px left"', () => {
      const s = reader.read("near button 5px left") as SpecNear;
      expect(s).toBeInstanceOf(SpecNear);
      expect(s.object).toBe("button");
    });
  });

  describe("contains", () => {
    it('parses "contains child1 child2"', () => {
      const s = reader.read("contains child1 child2") as SpecContains;
      expect(s.childObjects).toEqual(["child1", "child2"]);
      expect(s.partly).toBe(false);
    });

    it('parses "contains partly child1"', () => {
      const s = reader.read("contains partly child1") as SpecContains;
      expect(s.partly).toBe(true);
    });
  });

  describe("aligned", () => {
    it('parses "aligned vertically left obj"', () => {
      const s = reader.read("aligned vertically left obj") as SpecVertically;
      expect(s).toBeInstanceOf(SpecVertically);
      expect(s.alignment).toBe(Alignment.LEFT);
      expect(s.object).toBe("obj");
    });

    it('parses "aligned horizontally centered obj"', () => {
      const s = reader.read("aligned horizontally centered obj") as SpecHorizontally;
      expect(s).toBeInstanceOf(SpecHorizontally);
      expect(s.alignment).toBe(Alignment.CENTERED);
    });

    it('parses "aligned vertically all obj 2px" with error rate', () => {
      const s = reader.read("aligned vertically all obj 2px") as SpecVertically;
      expect(s.errorRate).toBe(2);
    });

    it('accepts tilde prefix on error rate: "aligned horizontally centered obj ~ 8px"', () => {
      const s = reader.read(
        "aligned horizontally centered obj ~ 8px",
      ) as SpecHorizontally;
      expect(s.errorRate).toBe(8);
    });

    it("throws for invalid direction", () => {
      expect(() => reader.read("aligned diagonal centered obj")).toThrow();
    });
  });

  describe("centered", () => {
    it('parses "centered on parent"', () => {
      const s = reader.read("centered on parent") as SpecCentered;
      expect(s.location).toBe(CenteredLocation.ON);
      expect(s.alignment).toBe(Alignment.ALL);
      expect(s.object).toBe("parent");
    });

    it('parses "centered inside parent"', () => {
      const s = reader.read("centered inside parent") as SpecCentered;
      expect(s.location).toBe(CenteredLocation.INSIDE);
    });

    it('parses "centered inside parent" with default ALL alignment', () => {
      const s = reader.read("centered inside parent") as SpecCentered;
      expect(s.alignment).toBe(Alignment.ALL);
      expect(s.location).toBe(CenteredLocation.INSIDE);
    });

    it("uses default error rate of 2", () => {
      const s = reader.read("centered on box") as SpecCentered;
      expect(s.errorRate).toBe(2);
    });

    it("parses with explicit error rate", () => {
      const s = reader.read("centered on box 5px") as SpecCentered;
      expect(s.errorRate).toBe(5);
    });

    it('accepts tilde prefix: "centered on box ~ 3px"', () => {
      const s = reader.read("centered on box ~ 3px") as SpecCentered;
      expect(s.errorRate).toBe(3);
    });
  });

  describe("text / css / ocr", () => {
    it('parses text is "hello"', () => {
      const s = reader.read('text is "hello"') as SpecText;
      expect(s).toBeInstanceOf(SpecText);
      expect(s.type).toBe(TextCheckType.IS);
      expect(s.text).toBe("hello");
    });

    it('parses text contains "world"', () => {
      const s = reader.read('text contains "world"') as SpecText;
      expect(s.type).toBe(TextCheckType.CONTAINS);
    });

    it('parses text starts "abc"', () => {
      const s = reader.read('text starts "abc"') as SpecText;
      expect(s.type).toBe(TextCheckType.STARTS);
    });

    it('parses text ends "xyz"', () => {
      const s = reader.read('text ends "xyz"') as SpecText;
      expect(s.type).toBe(TextCheckType.ENDS);
    });

    it('parses text matches "\\\\d+"', () => {
      const s = reader.read('text matches "\\d+"') as SpecText;
      expect(s.type).toBe(TextCheckType.MATCHES);
    });

    it('parses text with operations: lowercase is "hello"', () => {
      const s = reader.read('text lowercase is "hello"') as SpecText;
      expect(s.operations).toEqual(["lowercase"]);
      expect(s.type).toBe(TextCheckType.IS);
    });

    it('parses css font-size is "14px"', () => {
      const s = reader.read('css font-size is "14px"') as SpecCss;
      expect(s).toBeInstanceOf(SpecCss);
      expect(s.cssPropertyName).toBe("font-size");
      expect(s.text).toBe("14px");
    });

    it('parses ocr is "text"', () => {
      const s = reader.read('ocr is "text"') as SpecOcr;
      expect(s).toBeInstanceOf(SpecOcr);
    });
  });

  describe("visible / absent", () => {
    it('parses "visible"', () => {
      expect(reader.read("visible")).toBeInstanceOf(SpecVisible);
    });

    it('parses "absent"', () => {
      expect(reader.read("absent")).toBeInstanceOf(SpecAbsent);
    });
  });

  describe("count", () => {
    it('parses count with quoted pattern', () => {
      const s = reader.read('count any "button" is 5') as SpecCount;
      expect(s.fetchType).toBe(CountFetchType.ANY);
      expect(s.pattern).toBe("button");
      expect(s.amount.from!.asInt()).toBe(5);
    });

    it('parses "count visible button* is >= 1"', () => {
      const s = reader.read("count visible button* is >= 1") as SpecCount;
      expect(s.fetchType).toBe(CountFetchType.VISIBLE);
    });

    it('parses "count absent item* is 0"', () => {
      const s = reader.read("count absent item* is 0") as SpecCount;
      expect(s.fetchType).toBe(CountFetchType.ABSENT);
    });
  });

  describe("image", () => {
    it('parses image with file', () => {
      const s = reader.read('image file "test.png"') as SpecImage;
      expect(s).toBeInstanceOf(SpecImage);
      expect(s.imagePaths).toContain("test.png");
    });

    it('accepts tilde on percent error rate: "image file ..., error ~ 2%"', () => {
      const s = reader.read(
        'image file "test.png", error ~ 2%',
      ) as SpecImage;
      expect(s.errorRate).toEqual({ value: 2, type: ErrorRateType.PERCENT });
    });

    it('accepts tilde on pixel error rate: "image file ..., error ~ 5px"', () => {
      const s = reader.read(
        'image file "test.png", error ~ 5px',
      ) as SpecImage;
      expect(s.errorRate).toEqual({ value: 5, type: ErrorRateType.PIXELS });
    });
  });

  describe("component", () => {
    it('parses "component specs/login.gspec"', () => {
      const s = reader.read("component specs/login.gspec") as SpecComponent;
      expect(s).toBeInstanceOf(SpecComponent);
      expect(s.specPath).toContain("login.gspec");
      expect(s.frame).toBe(false);
    });

    it('parses "component frame specs/login.gspec"', () => {
      const s = reader.read("component frame specs/login.gspec") as SpecComponent;
      expect(s.frame).toBe(true);
    });
  });

  describe("unknown spec", () => {
    it('throws for unknown keyword "foobar"', () => {
      expect(() => reader.read("foobar 100px")).toThrow("Unknown spec");
    });
  });

  it("sets originalText on parsed spec", () => {
    const s = reader.read("width 100px");
    expect(s.originalText).toBe("width 100px");
  });
});
