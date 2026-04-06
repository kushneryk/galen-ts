import { describe, it, expect } from "vitest";
import { StructNode } from "../../src/parser/struct-node.js";
import { Place } from "../../src/specs/place.js";

describe("StructNode", () => {
  it("constructs with name and optional place", () => {
    const n = new StructNode("@objects", new Place("f.gspec", 1));
    expect(n.name).toBe("@objects");
    expect(n.place?.lineNumber).toBe(1);
  });

  it("hasChildNodes returns false when empty", () => {
    expect(new StructNode("test").hasChildNodes()).toBe(false);
  });

  it("hasChildNodes returns true when children exist", () => {
    const n = new StructNode("parent");
    n.childNodes.push(new StructNode("child"));
    expect(n.hasChildNodes()).toBe(true);
  });
});
