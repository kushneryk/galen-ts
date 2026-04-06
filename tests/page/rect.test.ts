import { describe, it, expect } from "vitest";
import { Rect } from "../../src/page/rect.js";
import { Point } from "../../src/page/point.js";
import { Side } from "../../src/specs/side.js";

describe("Rect", () => {
  const rect = new Rect(10, 20, 100, 50);

  it("constructs with left, top, width, height", () => {
    expect(rect.left).toBe(10);
    expect(rect.top).toBe(20);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(50);
  });

  describe("getters", () => {
    it("right returns left + width", () => expect(rect.right).toBe(110));
    it("bottom returns top + height", () => expect(rect.bottom).toBe(70));
  });

  describe("contains", () => {
    it("returns true for point inside", () => {
      expect(rect.contains(new Point(50, 40))).toBe(true);
    });

    it("returns true for point on left edge", () => {
      expect(rect.contains(new Point(10, 40))).toBe(true);
    });

    it("returns true for point on right edge", () => {
      expect(rect.contains(new Point(110, 40))).toBe(true);
    });

    it("returns true for point on top edge", () => {
      expect(rect.contains(new Point(50, 20))).toBe(true);
    });

    it("returns true for point on bottom edge", () => {
      expect(rect.contains(new Point(50, 70))).toBe(true);
    });

    it("returns false for point outside left", () => {
      expect(rect.contains(new Point(5, 40))).toBe(false);
    });

    it("returns false for point outside right", () => {
      expect(rect.contains(new Point(111, 40))).toBe(false);
    });

    it("returns false for point outside top", () => {
      expect(rect.contains(new Point(50, 19))).toBe(false);
    });

    it("returns false for point outside bottom", () => {
      expect(rect.contains(new Point(50, 71))).toBe(false);
    });
  });

  describe("getEdgePosition", () => {
    it("LEFT returns left", () => expect(rect.getEdgePosition(Side.LEFT)).toBe(10));
    it("RIGHT returns right", () => expect(rect.getEdgePosition(Side.RIGHT)).toBe(110));
    it("TOP returns top", () => expect(rect.getEdgePosition(Side.TOP)).toBe(20));
    it("BOTTOM returns bottom", () => expect(rect.getEdgePosition(Side.BOTTOM)).toBe(70));
  });

  describe("offset", () => {
    it("shifts left and top by offsets", () => {
      const shifted = rect.offset(5, 10);
      expect(shifted.left).toBe(15);
      expect(shifted.top).toBe(30);
    });

    it("preserves width and height", () => {
      const shifted = rect.offset(5, 10);
      expect(shifted.width).toBe(100);
      expect(shifted.height).toBe(50);
    });
  });

  describe("boundaryOf", () => {
    it("throws for 0 rects", () => {
      expect(() => Rect.boundaryOf()).toThrow();
    });

    it("returns same rect for 1 rect", () => {
      const r = Rect.boundaryOf(new Rect(5, 5, 10, 10));
      expect(r.left).toBe(5);
      expect(r.width).toBe(10);
    });

    it("computes bounding box of multiple rects", () => {
      const r = Rect.boundaryOf(
        new Rect(0, 0, 10, 10),
        new Rect(20, 30, 5, 5),
      );
      expect(r.left).toBe(0);
      expect(r.top).toBe(0);
      expect(r.right).toBe(25);
      expect(r.bottom).toBe(35);
    });
  });

  describe("toArray", () => {
    it("returns [left, top, width, height]", () => {
      expect(rect.toArray()).toEqual([10, 20, 100, 50]);
    });
  });

  describe("toString", () => {
    it("formats correctly", () => {
      expect(rect.toString()).toBe("Rect{left=10, top=20, width=100, height=50}");
    });
  });
});
