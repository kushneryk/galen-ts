import { describe, it, expect } from "vitest";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { SpecVisible } from "../../../src/specs/specs.js";

describe("PageSpec", () => {
  describe("addObject / getObjectLocator", () => {
    it("stores and retrieves locator", () => {
      const ps = new PageSpec();
      const loc = Locator.css(".header");
      ps.addObject("header", loc);
      expect(ps.getObjectLocator("header")).toBe(loc);
    });

    it("returns undefined for unknown object", () => {
      expect(new PageSpec().getObjectLocator("nope")).toBeUndefined();
    });
  });

  describe("addSection", () => {
    it("appends section to sections array", () => {
      const ps = new PageSpec();
      ps.addSection({ name: "Main", objects: [], sections: [] });
      expect(ps.sections).toHaveLength(1);
      expect(ps.sections[0].name).toBe("Main");
    });
  });

  describe("addObjectGroup / findObjectsInGroup", () => {
    it("stores and retrieves group members", () => {
      const ps = new PageSpec();
      ps.addObjectGroup("buttons", ["btn1", "btn2"]);
      expect(ps.findObjectsInGroup("buttons")).toEqual(["btn1", "btn2"]);
    });

    it("returns empty array for unknown group", () => {
      expect(new PageSpec().findObjectsInGroup("nope")).toEqual([]);
    });
  });

  describe("getSortedObjectNames", () => {
    it("returns sorted names", () => {
      const ps = new PageSpec();
      ps.addObject("z-item", Locator.css(".z"));
      ps.addObject("a-item", Locator.css(".a"));
      ps.addObject("m-item", Locator.css(".m"));
      expect(ps.getSortedObjectNames()).toEqual(["a-item", "m-item", "z-item"]);
    });

    it("returns empty for no objects", () => {
      expect(new PageSpec().getSortedObjectNames()).toEqual([]);
    });
  });

  describe("findMatchingObjectNames", () => {
    const ps = new PageSpec();
    ps.addObject("header", Locator.css(".h"));
    ps.addObject("header.icon", Locator.css(".hi"));
    ps.addObject("button-1", Locator.css(".b1"));
    ps.addObject("button-2", Locator.css(".b2"));

    it("returns exact match for non-wildcard", () => {
      expect(ps.findMatchingObjectNames("header")).toEqual(["header"]);
    });

    it("returns empty array for non-existent non-wildcard", () => {
      expect(ps.findMatchingObjectNames("footer")).toEqual([]);
    });

    it('matches wildcard pattern "button-*"', () => {
      expect(ps.findMatchingObjectNames("button-*")).toEqual(["button-1", "button-2"]);
    });

    it('matches "*" for all objects', () => {
      expect(ps.findMatchingObjectNames("*")).toHaveLength(4);
    });

    it('matches "header.*"', () => {
      expect(ps.findMatchingObjectNames("header.*")).toEqual(["header.icon"]);
    });
  });

  describe("addSpec", () => {
    it("adds spec to existing section object", () => {
      const ps = new PageSpec();
      ps.addSection({
        name: "main",
        objects: [{ objectName: "header", specs: [], specGroups: [] }],
        sections: [],
      });
      ps.addSpec("header", new SpecVisible());
      expect(ps.sections[0].objects[0].specs).toHaveLength(1);
    });

    it("creates default section when none exists", () => {
      const ps = new PageSpec();
      ps.addSpec("header", new SpecVisible());
      expect(ps.sections).toHaveLength(1);
      expect(ps.sections[0].objects[0].objectName).toBe("header");
    });
  });

  describe("merge", () => {
    it("merges objects, sections, and groups from other PageSpec", () => {
      const a = new PageSpec();
      a.addObject("a", Locator.css(".a"));
      a.addObjectGroup("g1", ["a"]);

      const b = new PageSpec();
      b.addObject("b", Locator.css(".b"));
      b.addObjectGroup("g2", ["b"]);
      b.addSection({ name: "S", objects: [], sections: [] });

      a.merge(b);
      expect(a.getObjectLocator("b")).toBeDefined();
      expect(a.findObjectsInGroup("g2")).toEqual(["b"]);
      expect(a.sections).toHaveLength(1);
    });
  });
});
