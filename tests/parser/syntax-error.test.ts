import { describe, it, expect } from "vitest";
import { SyntaxError } from "../../src/parser/syntax-error.js";
import { Place } from "../../src/specs/place.js";

describe("SyntaxError", () => {
  it("formats message with place", () => {
    const e = new SyntaxError(new Place("file.gspec", 10), "bad thing");
    expect(e.message).toBe("file.gspec:10: bad thing");
  });

  it("formats message without place", () => {
    const e = new SyntaxError(undefined, "bad thing");
    expect(e.message).toBe("bad thing");
  });

  it('has name "SyntaxError"', () => {
    expect(new SyntaxError(undefined, "x").name).toBe("SyntaxError");
  });

  it("stores place property", () => {
    const place = new Place("a.gspec", 5);
    expect(new SyntaxError(place, "x").place).toBe(place);
  });
});
