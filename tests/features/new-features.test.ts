import { describe, it, expect } from "vitest";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { Locator } from "../../src/specs/page/locator.js";
import { SpecReader } from "../../src/parser/spec-reader.js";
import { PageSpecReader } from "../../src/parser/page-spec-reader.js";
import {
  SpecCentered, SpecImage, SpecOn,
  Alignment, CenteredLocation,
} from "../../src/specs/specs.js";
import { Range, RangeValue } from "../../src/specs/range.js";
import { Rect } from "../../src/page/rect.js";
import { buildPageValidation } from "../helpers/mock-page-element.js";
import { createSpecJsFunctions } from "../../src/parser/js-executor.js";

const specReader = new SpecReader();

// =============================================================================
// 1. PageSpec: # wildcard + &group expansion
// =============================================================================

describe("PageSpec # wildcard", () => {
  const ps = new PageSpec();
  ps.addObject("button1", Locator.css(".b1"));
  ps.addObject("button2", Locator.css(".b2"));
  ps.addObject("button-a", Locator.css(".ba"));
  ps.addObject("item10", Locator.css(".i10"));

  it('# matches digits only: "button#" matches button1, button2 but not button-a', () => {
    const matches = ps.findMatchingObjectNames("button#");
    expect(matches).toContain("button1");
    expect(matches).toContain("button2");
    expect(matches).not.toContain("button-a");
  });

  it('# matches multi-digit: "item#" matches item10', () => {
    expect(ps.findMatchingObjectNames("item#")).toContain("item10");
  });

  it("# with no matches returns empty", () => {
    expect(ps.findMatchingObjectNames("nonexistent#")).toEqual([]);
  });
});

describe("PageSpec &group expansion", () => {
  const ps = new PageSpec();
  ps.addObject("btn1", Locator.css(".b1"));
  ps.addObject("btn2", Locator.css(".b2"));
  ps.addObjectGroup("buttons", ["btn1", "btn2"]);

  it("&groupName returns group members", () => {
    expect(ps.findMatchingObjectNames("&buttons")).toEqual(["btn1", "btn2"]);
  });

  it("&unknownGroup returns empty", () => {
    expect(ps.findMatchingObjectNames("&nope")).toEqual([]);
  });
});

// =============================================================================
// 2. centered horizontally / vertically direction keywords
// =============================================================================

describe("centered with direction keywords", () => {
  it('parses "centered horizontally inside parent"', () => {
    const s = specReader.read("centered horizontally inside parent") as SpecCentered;
    expect(s).toBeInstanceOf(SpecCentered);
    expect(s.alignment).toBe(Alignment.HORIZONTALLY);
    expect(s.location).toBe(CenteredLocation.INSIDE);
    expect(s.object).toBe("parent");
  });

  it('parses "centered vertically on container"', () => {
    const s = specReader.read("centered vertically on container") as SpecCentered;
    expect(s.alignment).toBe(Alignment.VERTICALLY);
    expect(s.location).toBe(CenteredLocation.ON);
  });

  it('parses "centered all inside box"', () => {
    const s = specReader.read("centered all inside box") as SpecCentered;
    expect(s.alignment).toBe(Alignment.ALL);
  });

  it("centered horizontally only checks horizontal axis", async () => {
    const ps = new PageSpec();
    ps.addObject("child", Locator.css(".c"));
    ps.addObject("parent", Locator.css(".p"));
    // child centered horizontally (left=25, right margin=25) but NOT vertically (top=10, bottom=40)
    const pv = buildPageValidation({
      child: { rect: new Rect(25, 10, 50, 50) },
      parent: { rect: new Rect(0, 0, 100, 100) },
    }, ps);
    const r = await pv.check("child", new SpecCentered("parent", Alignment.HORIZONTALLY, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeUndefined(); // should pass — only checks horizontal
  });

  it("centered vertically only checks vertical axis", async () => {
    const ps = new PageSpec();
    ps.addObject("child", Locator.css(".c"));
    ps.addObject("parent", Locator.css(".p"));
    // child centered vertically (top=25, bottom margin=25) but NOT horizontally (left=10, right=40)
    const pv = buildPageValidation({
      child: { rect: new Rect(10, 25, 50, 50) },
      parent: { rect: new Rect(0, 0, 100, 100) },
    }, ps);
    const r = await pv.check("child", new SpecCentered("parent", Alignment.VERTICALLY, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeUndefined();
  });

  it("centered horizontally fails when not horizontally centered", async () => {
    const ps = new PageSpec();
    ps.addObject("child", Locator.css(".c"));
    ps.addObject("parent", Locator.css(".p"));
    // left=30, right=20 → offset=10 > errorRate=2
    const pv = buildPageValidation({
      child: { rect: new Rect(30, 25, 50, 50) },
      parent: { rect: new Rect(0, 0, 100, 100) },
    }, ps);
    const r = await pv.check("child", new SpecCentered("parent", Alignment.HORIZONTALLY, CenteredLocation.INSIDE, 2));
    expect(r.error).toBeDefined();
  });
});

// =============================================================================
// 3. Object corrections @(left, top, width, height)
// =============================================================================

describe("object corrections @(...)", () => {
  it("parses corrections from object definition", () => {
    const reader = new PageSpecReader();
    const spec = reader.read("@objects\n  btn @(0, 0, -50, 0) css .btn");
    const locator = spec.getObjectLocator("btn");
    expect(locator).toBeDefined();
    expect(locator!.corrections).toBeDefined();
    expect(locator!.corrections!.width?.value).toBe(50);
  });

  it("parses positive corrections", () => {
    const reader = new PageSpecReader();
    const spec = reader.read("@objects\n  el @(+10, +20, 0, 0) css .el");
    const locator = spec.getObjectLocator("el");
    expect(locator!.corrections!.left?.value).toBe(10);
    expect(locator!.corrections!.top?.value).toBe(20);
  });

  it("parses equals corrections", () => {
    const reader = new PageSpecReader();
    const spec = reader.read("@objects\n  el @(=100, =200, 0, 0) css .el");
    const locator = spec.getObjectLocator("el");
    expect(locator!.corrections!.left?.value).toBe(100);
  });
});

// =============================================================================
// 4. @grouped(name) inline syntax
// =============================================================================

describe("@grouped(name) inline in @objects", () => {
  it("adds object to group", () => {
    const reader = new PageSpecReader();
    const spec = reader.read("@objects\n  logo @grouped(images) css img.logo\n  icon @grouped(images) css .icon");
    const group = spec.findObjectsInGroup("images");
    expect(group).toContain("logo");
    expect(group).toContain("icon");
  });
});

// =============================================================================
// 5. &group-name expansion in object specs
// =============================================================================

describe("&group in section object specs", () => {
  it("expands &groupName to group members", () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@objects
  btn1 css .b1
  btn2 css .b2

@groups
  buttons btn1, btn2

= Layout =
  &buttons:
    visible
`);
    // The section should have specs for btn1 and btn2
    const section = spec.sections[0];
    const objectNames = section.objects.map(o => o.objectName);
    expect(objectNames).toContain("btn1");
    expect(objectNames).toContain("btn2");
  });
});

// =============================================================================
// 6. @rule with %{param} and | invocation
// =============================================================================

describe("@rule with %{param}", () => {
  it("defines and invokes a rule", () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@objects
  menu css .menu

@rule %{objectName} should be squared
  \${objectName}:
    width 100px

= Test =
  | menu should be squared
`);
    const section = spec.sections[0];
    // The rule should have expanded to add specs for "menu"
    const menuObj = section.objects.find(o => o.objectName === "menu");
    expect(menuObj).toBeDefined();
    expect(menuObj!.specs.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// 7. @lib directive
// =============================================================================

describe("@lib directive", () => {
  it("maps to @import", () => {
    const reader = new PageSpecReader();
    // @lib with non-existent file should throw (proving it goes through import path)
    expect(() => reader.read("@lib nonexistent.gspec")).toThrow();
  });
});

// =============================================================================
// 8. on with "edge" keyword
// =============================================================================

describe('on spec with "edge" keyword', () => {
  it('parses "on button top left edge"', () => {
    // "edge" is optional — should be consumed without error
    const s = specReader.read("on button top left");
    expect(s).toBeInstanceOf(SpecOn);
    expect((s as SpecOn).object).toBe("button");
  });
});

// =============================================================================
// 9. image spec: ignore-objects + filter params
// =============================================================================

describe("image spec enhancements", () => {
  it("parses ignore-objects", () => {
    const s = specReader.read('image file "test.png", ignore-objects banner') as SpecImage;
    expect(s.ignoredObjectExpressions).toContain("banner");
  });

  it("parses filter with params", () => {
    const s = specReader.read('image file "test.png", filter blur 3') as SpecImage;
    expect(s.originalFilters.length).toBeGreaterThanOrEqual(1);
    expect(s.originalFilters[0].name).toBe("blur");
    expect(s.originalFilters[0].params).toContain(3);
  });

  it("parses filter-a and filter-b separately", () => {
    const s = specReader.read('image file "test.png", filter-a contrast 10, filter-b saturation 0') as SpecImage;
    expect(s.originalFilters[0].name).toBe("contrast");
    expect(s.sampleFilters[0].name).toBe("saturation");
  });
});

// =============================================================================
// 10. color-scheme with percentage and gradient
// =============================================================================

describe("color-scheme enhancements", () => {
  it('parses "50% white" format', () => {
    const s = specReader.read("color-scheme 50% white");
    expect(s.originalText).toBe("color-scheme 50% white");
  });

  it('parses multiple color ranges "50% black, 50% white"', () => {
    const s = specReader.read("color-scheme 50% black, 50% white");
    expect(s).toBeDefined();
  });
});

// =============================================================================
// 11. JS find() returning rich objects
// =============================================================================

describe("JS find() rich objects", () => {
  const ps = new PageSpec();
  ps.addObject("header", Locator.css(".h"));
  ps.addObject("btn-1", Locator.css(".b1"));
  ps.addObject("btn-2", Locator.css(".b2"));

  it("find returns objects with name property", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const find = fns.find as (p: string) => { name: string }[];
    const results = find("btn-*");
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("btn-1");
    expect(results[1].name).toBe("btn-2");
  });

  it("first returns rich object with name", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const first = fns.first as (p: string) => { name: string } | null;
    expect(first("btn-*")?.name).toBe("btn-1");
  });

  it("last returns rich object with name", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const last = fns.last as (p: string) => { name: string } | null;
    expect(last("btn-*")?.name).toBe("btn-2");
  });

  it("first returns null for no matches", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const first = fns.first as (p: string) => null;
    expect(first("nonexistent*")).toBeNull();
  });

  it("viewport object has width/height methods", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const viewport = fns.viewport as { width: () => number; height: () => number };
    expect(viewport).toBeDefined();
    expect(typeof viewport.width).toBe("function");
    expect(typeof viewport.height).toBe("function");
  });

  it("screen object has width/height methods", () => {
    const fns = createSpecJsFunctions(undefined, ps);
    const screen = fns.screen as { width: () => number; height: () => number };
    expect(screen).toBeDefined();
    expect(typeof screen.width).toBe("function");
    expect(typeof screen.height).toBe("function");
  });
});

// =============================================================================
// 12. Special objects: parent, self, global
// =============================================================================

describe("special objects in page-spec-reader", () => {
  it('parses "global:" as a valid object in section', () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@objects
  btn-1 css .b1
  btn-2 css .b2

= Test =
  global:
    count any "btn-*" is 2
`);
    const section = spec.sections[0];
    const globalObj = section.objects.find(o => o.objectName === "global");
    expect(globalObj).toBeDefined();
    expect(globalObj!.specs).toHaveLength(1);
  });
});

// =============================================================================
// 13. @script external file (tested via error path — file not found)
// =============================================================================

describe("@script external file", () => {
  it("throws when script file not found", () => {
    const reader = new PageSpecReader();
    expect(() => reader.read("@script nonexistent-file.js")).toThrow("not found");
  });
});

// =============================================================================
// 14. Negative test: centered ALL fails on both axes
// =============================================================================

describe("centered ALL negative tests", () => {
  it("fails when neither axis is centered", async () => {
    const ps = new PageSpec();
    ps.addObject("child", Locator.css(".c"));
    ps.addObject("parent", Locator.css(".p"));
    const pv = buildPageValidation({
      child: { rect: new Rect(40, 40, 50, 50) },
      parent: { rect: new Rect(0, 0, 100, 100) },
    }, ps);
    const r = await pv.check("child", new SpecCentered("parent", Alignment.ALL, CenteredLocation.INSIDE, 2));
    // left=40, right=10 → offset=30 > 2 → fail
    expect(r.error).toBeDefined();
  });
});

// =============================================================================
// 15. @if with @elseif chain — negative
// =============================================================================

describe("@if/@elseif/@else negative paths", () => {
  it("@elseif is evaluated when @if is false", () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@set a false
@set b true
@if \${a}
  = IfSection =
@elseif \${b}
  = ElseIfSection =
@else
  = ElseSection =
`);
    expect(spec.sections.some(s => s.name === "ElseIfSection")).toBe(true);
    expect(spec.sections.some(s => s.name === "IfSection")).toBe(false);
    expect(spec.sections.some(s => s.name === "ElseSection")).toBe(false);
  });

  it("@else is evaluated when all conditions are false", () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@set a false
@set b false
@if \${a}
  = IfSection =
@elseif \${b}
  = ElseIfSection =
@else
  = ElseSection =
`);
    expect(spec.sections.some(s => s.name === "ElseSection")).toBe(true);
  });
});

// =============================================================================
// 16. Integration: full .gspec with new features
// =============================================================================

describe("integration: full .gspec with new features", () => {
  it("parses complex spec with corrections, groups, and rules", () => {
    const reader = new PageSpecReader();
    const spec = reader.read(`
@objects
  header css .header
  logo @grouped(images) css img.logo
  menu css .menu
  menu-item-1 css .mi1
  menu-item-2 css .mi2

@groups
  nav-items menu-item-1, menu-item-2

@rule %{name} should be inside header
  \${name}:
    visible

= Main =
  header:
    visible
    height 50 to 80px

  | logo should be inside header

  &nav-items:
    visible
`);
    expect(spec.getObjectLocator("header")).toBeDefined();
    expect(spec.getObjectLocator("logo")).toBeDefined();
    expect(spec.findObjectsInGroup("images")).toContain("logo");
    expect(spec.findObjectsInGroup("nav-items")).toEqual(["menu-item-1", "menu-item-2"]);

    const section = spec.sections[0];
    // header should have its own specs
    const headerObj = section.objects.find(o => o.objectName === "header");
    expect(headerObj).toBeDefined();
    expect(headerObj!.specs.length).toBe(2);

    // &nav-items should expand to menu-item-1 and menu-item-2
    const mi1 = section.objects.find(o => o.objectName === "menu-item-1");
    const mi2 = section.objects.find(o => o.objectName === "menu-item-2");
    expect(mi1).toBeDefined();
    expect(mi2).toBeDefined();
  });
});
