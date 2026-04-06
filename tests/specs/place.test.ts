import { describe, it, expect } from "vitest";
import { Place } from "../../src/specs/place.js";

describe("Place", () => {
  it("constructs with filePath and lineNumber", () => {
    const p = new Place("test.gspec", 42);
    expect(p.filePath).toBe("test.gspec");
    expect(p.lineNumber).toBe(42);
  });

  it('toPrettyString formats as "path:line"', () => {
    expect(new Place("file.gspec", 10).toPrettyString()).toBe("file.gspec:10");
  });

  it("toString delegates to toPrettyString", () => {
    const p = new Place("a.gspec", 1);
    expect(p.toString()).toBe(p.toPrettyString());
  });
});
