import { describe, it, expect } from "vitest";
import { SuiteReader } from "../../src/suite/suite-reader.js";
import { PageActionOpen, PageActionResize, PageActionCheck, PageActionWait } from "../../src/suite/page-action.js";

const reader = new SuiteReader();

describe("SuiteReader", () => {
  describe("parse", () => {
    it("parses simple test definition", () => {
      const tests = reader.parse("[My Test]\n  open http://example.com");
      expect(tests).toHaveLength(1);
      expect(tests[0].title).toBe("My Test");
      expect(tests[0].actions).toHaveLength(1);
    });

    it("parses @@set variable", () => {
      const tests = reader.parse("@@ set domain http://example.com\n\n[Test]\n  open ${domain}/page");
      expect(tests[0].actions[0]).toBeInstanceOf(PageActionOpen);
      expect((tests[0].actions[0] as PageActionOpen).url).toBe("http://example.com/page");
    });

    it("parses @@parameterized expansion", () => {
      const text = `@@ parameterized size
  1024 | 768
  320 | 568

[Test \${size}]
  open http://example.com`;
      const tests = reader.parse(text);
      expect(tests).toHaveLength(2);
    });

    it("parses @@disabled flag", () => {
      const tests = reader.parse("@@ disabled\n\n[Disabled Test]\n  open http://example.com");
      expect(tests[0].disabled).toBe(true);
    });

    it("parses @@groups", () => {
      const tests = reader.parse("@@ groups smoke, regression\n\n[Test]\n  open http://example.com");
      expect(tests[0].groups).toEqual(["smoke", "regression"]);
    });

    it("skips comments and blank lines", () => {
      const tests = reader.parse("# comment\n\n[Test]\n  open http://example.com");
      expect(tests).toHaveLength(1);
    });

    it("skips separator lines", () => {
      const tests = reader.parse("---\n===\n[Test]\n  open http://example.com");
      expect(tests).toHaveLength(1);
    });

    it("parses open action", () => {
      const tests = reader.parse("[T]\n  open http://example.com/page");
      expect(tests[0].actions[0]).toBeInstanceOf(PageActionOpen);
    });

    it("parses resize action with x separator", () => {
      const tests = reader.parse("[T]\n  resize 1024x768");
      const action = tests[0].actions[0] as PageActionResize;
      expect(action).toBeInstanceOf(PageActionResize);
      expect(action.width).toBe(1024);
      expect(action.height).toBe(768);
    });

    it("parses check action with --include/--exclude tags", () => {
      const tests = reader.parse("[T]\n  check home.gspec --include desktop --exclude experimental", ".");
      const action = tests[0].actions[0] as PageActionCheck;
      expect(action).toBeInstanceOf(PageActionCheck);
      expect(action.options.sectionFilter?.includedTags).toContain("desktop");
      expect(action.options.sectionFilter?.excludedTags).toContain("experimental");
    });

    it("parses wait action", () => {
      const tests = reader.parse("[T]\n  wait 500");
      const action = tests[0].actions[0] as PageActionWait;
      expect(action).toBeInstanceOf(PageActionWait);
      expect(action.milliseconds).toBe(500);
    });

    it("substitutes variables in test title", () => {
      const tests = reader.parse("@@ set env staging\n\n[Test on ${env}]\n  open http://example.com");
      expect(tests[0].title).toBe("Test on staging");
    });

    it("resets groups and disabled after each test", () => {
      const tests = reader.parse("@@ disabled\n@@ groups smoke\n\n[T1]\n  open http://a.com\n\n[T2]\n  open http://b.com");
      expect(tests[0].disabled).toBe(true);
      expect(tests[0].groups).toEqual(["smoke"]);
      expect(tests[1].disabled).toBe(false);
      expect(tests[1].groups).toEqual([]);
    });
  });
});
