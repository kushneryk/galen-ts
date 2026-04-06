import { describe, it, expect } from "vitest";
import { Side, oppositeSide, parseSide } from "../../src/specs/side.js";

describe("Side enum", () => {
  it("has LEFT, RIGHT, TOP, BOTTOM values", () => {
    expect(Side.LEFT).toBe("left");
    expect(Side.RIGHT).toBe("right");
    expect(Side.TOP).toBe("top");
    expect(Side.BOTTOM).toBe("bottom");
  });
});

describe("oppositeSide", () => {
  it("LEFT returns RIGHT", () => expect(oppositeSide(Side.LEFT)).toBe(Side.RIGHT));
  it("RIGHT returns LEFT", () => expect(oppositeSide(Side.RIGHT)).toBe(Side.LEFT));
  it("TOP returns BOTTOM", () => expect(oppositeSide(Side.TOP)).toBe(Side.BOTTOM));
  it("BOTTOM returns TOP", () => expect(oppositeSide(Side.BOTTOM)).toBe(Side.TOP));
});

describe("parseSide", () => {
  it('parses "left"', () => expect(parseSide("left")).toBe(Side.LEFT));
  it('parses "RIGHT" case insensitive', () => expect(parseSide("RIGHT")).toBe(Side.RIGHT));
  it('parses "  top  " with whitespace', () => expect(parseSide("  top  ")).toBe(Side.TOP));
  it('parses "bottom"', () => expect(parseSide("bottom")).toBe(Side.BOTTOM));
  it('throws for unknown string "center"', () => expect(() => parseSide("center")).toThrow());
  it("throws for empty string", () => expect(() => parseSide("")).toThrow());
});
