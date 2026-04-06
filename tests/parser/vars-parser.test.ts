import { describe, it, expect } from "vitest";
import { VarsParser } from "../../src/parser/vars-parser.js";

describe("VarsParser", () => {
  describe("parse", () => {
    it("returns text unchanged when no variables", () => {
      expect(new VarsParser().parse("hello world")).toBe("hello world");
    });

    it("substitutes simple variable ${name}", () => {
      const p = new VarsParser({ name: "John" });
      expect(p.parse("hello ${name}")).toBe("hello John");
    });

    it("handles multiple variables in one string", () => {
      const p = new VarsParser({ a: "1", b: "2" });
      expect(p.parse("${a} and ${b}")).toBe("1 and 2");
    });

    it("handles escaped \\$ as literal $", () => {
      expect(new VarsParser().parse("price: \\$100")).toBe("price: $100");
    });

    it("evaluates JS expression ${1 + 2}", () => {
      expect(new VarsParser().parse("${1 + 2}")).toBe("3");
    });

    it("returns empty for missing variable", () => {
      expect(new VarsParser().parse("${missing}")).toBe("");
    });

    it("uses properties for substitution", () => {
      const p = new VarsParser({}, { env: "production" });
      expect(p.parse("${env}")).toBe("production");
    });
  });

  describe("setVariable / getVariable", () => {
    it("sets and retrieves variable", () => {
      const p = new VarsParser();
      p.setVariable("x", 42);
      expect(p.getVariable("x")).toBe(42);
    });

    it("getVariable returns undefined for unset", () => {
      expect(new VarsParser().getVariable("nope")).toBeUndefined();
    });
  });
});
