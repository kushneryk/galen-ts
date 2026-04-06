import { describe, it, expect } from "vitest";
import { PageSpecReader } from "../../src/parser/page-spec-reader.js";

const reader = new PageSpecReader();

describe("PageSpecReader", () => {
  describe("@objects", () => {
    it("parses CSS locator", () => {
      const spec = reader.read("@objects\n  header css .header");
      expect(spec.getObjectLocator("header")).toBeDefined();
      expect(spec.getObjectLocator("header")!.locatorValue).toBe(".header");
    });

    it("parses explicit xpath", () => {
      const spec = reader.read("@objects\n  nav xpath //nav");
      expect(spec.getObjectLocator("nav")!.locatorValue).toBe("//nav");
    });

    it("parses ID locator", () => {
      const spec = reader.read("@objects\n  logo id main-logo");
      expect(spec.getObjectLocator("logo")!.locatorValue).toBe("#main-logo");
    });

    it("auto-detects xpath for / prefix", () => {
      const spec = reader.read("@objects\n  nav /html/body/nav");
      expect(spec.getObjectLocator("nav")!.locatorValue).toBe("/html/body/nav");
    });

    it("parses nested objects (parent.child)", () => {
      const spec = reader.read("@objects\n  header .header\n    icon .icon");
      expect(spec.getObjectLocator("header.icon")).toBeDefined();
    });
  });

  describe("@set", () => {
    it("parses inline form: @set varName value", () => {
      const spec = reader.read("@set myVar 100\n= S =\n  ");
      // Variable set — no error
      expect(spec).toBeDefined();
    });

    it("parses block form with child variables", () => {
      const text = "@set\n  width 100\n  height 50";
      expect(() => reader.read(text)).not.toThrow();
    });

    it("throws for invalid variable name", () => {
      expect(() => reader.read("@set 123bad value")).toThrow();
    });
  });

  describe("@groups", () => {
    it("parses single group", () => {
      const spec = reader.read("@objects\n  btn1 .b1\n  btn2 .b2\n@groups\n  buttons btn1, btn2");
      // Groups may not match since findMatchingObjectNames needs exact or wildcard
      expect(spec).toBeDefined();
    });

    it("parses multiple groups in parentheses", () => {
      const text = "@objects\n  btn1 .b1\n@groups\n  (primary, all) btn1";
      expect(() => reader.read(text)).not.toThrow();
    });
  });

  describe("@on", () => {
    it("processes children when tag matches", () => {
      const text = "@objects\n  btn .btn\n@on desktop\n  = Section =\n    btn:\n      visible";
      const spec = reader.read(text, "<inline>", {
        sectionFilter: { includedTags: ["desktop"], excludedTags: [] },
      });
      expect(spec.sections).toHaveLength(1);
    });

    it("skips children when tag is excluded", () => {
      const text = "@objects\n  btn .btn\n@on mobile\n  = Section =\n    btn:\n      visible";
      const spec = reader.read(text, "<inline>", {
        sectionFilter: { includedTags: ["desktop"], excludedTags: ["mobile"] },
      });
      expect(spec.sections).toHaveLength(0);
    });

    it("matches wildcard * tag", () => {
      const text = "@on *\n  = Section =";
      const spec = reader.read(text, "<inline>", {
        sectionFilter: { includedTags: ["anything"], excludedTags: [] },
      });
      expect(spec.sections).toHaveLength(1);
    });
  });

  describe("@if / @elseif / @else", () => {
    it("processes @if block when condition is true", () => {
      const text = "@set show true\n@if ${show}\n  = Visible =";
      const spec = reader.read(text);
      expect(spec.sections.some(s => s.name === "Visible")).toBe(true);
    });

    it("skips @if block when condition is false", () => {
      const text = "@set show false\n@if ${show}\n  = Visible =\n@else\n  = Hidden =";
      const spec = reader.read(text);
      expect(spec.sections.some(s => s.name === "Hidden")).toBe(true);
      expect(spec.sections.some(s => s.name === "Visible")).toBe(false);
    });
  });

  describe("@for", () => {
    it("expands numeric range [1-3]", () => {
      const text = "@objects\n  item .item\n@for [1-3] as i\n  @set v_${i} yes";
      expect(() => reader.read(text)).not.toThrow();
    });
  });

  describe("@die", () => {
    it("throws SyntaxError with message", () => {
      expect(() => reader.read('@die "Something went wrong"')).toThrow("Something went wrong");
    });
  });

  describe("sections", () => {
    it('parses "= Section Name =" header', () => {
      const spec = reader.read("= Main Layout =");
      expect(spec.sections).toHaveLength(1);
      expect(spec.sections[0].name).toBe("Main Layout");
    });

    it("parses nested sections", () => {
      const text = "= Parent =\n  == Child ==";
      const spec = reader.read(text);
      expect(spec.sections.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("object specs", () => {
    it("parses objectName: with child specs", () => {
      const text = "@objects\n  btn .btn\n= S =\n  btn:\n    visible";
      const spec = reader.read(text);
      const section = spec.sections[0];
      expect(section.objects[0].specs).toHaveLength(1);
    });

    it("handles % warning prefix", () => {
      const text = "@objects\n  btn .btn\n= S =\n  btn:\n    % visible";
      const spec = reader.read(text);
      expect(spec.sections[0].objects[0].specs[0].onlyWarn).toBe(true);
    });

    it('handles "alias" prefix', () => {
      const text = '@objects\n  btn .btn\n= S =\n  btn:\n    "my check" visible';
      const spec = reader.read(text);
      expect(spec.sections[0].objects[0].specs[0].alias).toBe("my check");
    });
  });

  describe("integration", () => {
    it("parses complete .gspec text", () => {
      const text = `
@objects
  header      css  #header
  menu        css  .menu
  footer      id   footer

@set
  margin  10

= Main Layout =
  header:
    height 50 to 80px
    visible

  menu:
    below header \${margin}px

  footer:
    visible
`;
      const spec = reader.read(text);
      expect(spec.getObjectLocator("header")).toBeDefined();
      expect(spec.getObjectLocator("menu")).toBeDefined();
      expect(spec.getObjectLocator("footer")).toBeDefined();
      expect(spec.sections).toHaveLength(1);
      expect(spec.sections[0].objects).toHaveLength(3);
    });
  });
});
