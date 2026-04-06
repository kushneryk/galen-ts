import { describe, it, expect } from "vitest";
import { Point } from "../../src/page/point.js";

describe("Point", () => {
  it("constructs with left and top", () => {
    const p = new Point(10, 20);
    expect(p.left).toBe(10);
    expect(p.top).toBe(20);
  });

  it("toString formats correctly", () => {
    expect(new Point(5, 15).toString()).toBe("Point{left=5, top=15}");
  });
});
