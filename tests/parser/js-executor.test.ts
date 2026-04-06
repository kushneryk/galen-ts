import { describe, it, expect } from "vitest";
import { createSpecJsFunctions } from "../../src/parser/js-executor.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { Locator } from "../../src/specs/page/locator.js";

describe("createSpecJsFunctions", () => {
  const pageSpec = new PageSpec();
  pageSpec.addObject("button-1", Locator.css(".b1"));
  pageSpec.addObject("button-2", Locator.css(".b2"));
  pageSpec.addObject("header", Locator.css(".h"));

  describe("find / findAll", () => {
    it("returns matching rich objects with name property", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const find = fns.find as (p: string) => { name: string }[];
      const results = find("button-*");
      expect(results.map((r) => r.name)).toEqual(["button-1", "button-2"]);
    });

    it("findAll is alias for find", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      expect(fns.findAll).toBe(fns.find);
    });
  });

  describe("first / last", () => {
    it("first returns first match as rich object", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const first = fns.first as (p: string) => { name: string } | null;
      const result = first("button-*");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("button-1");
    });

    it("first returns null for no match", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const first = fns.first as (p: string) => { name: string } | null;
      expect(first("nonexistent-*")).toBeNull();
    });

    it("last returns last match as rich object", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const last = fns.last as (p: string) => { name: string } | null;
      const result = last("button-*");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("button-2");
    });

    it("last returns null for no match", () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const last = fns.last as (p: string) => { name: string } | null;
      expect(last("nope-*")).toBeNull();
    });
  });

  describe("isVisible / isPresent / count without page", () => {
    it("isVisible returns false", async () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const isVisible = fns.isVisible as (n: string) => Promise<boolean>;
      expect(await isVisible("header")).toBe(false);
    });

    it("isPresent returns false", async () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const isPresent = fns.isPresent as (n: string) => Promise<boolean>;
      expect(await isPresent("header")).toBe(false);
    });

    it("count returns 0", async () => {
      const fns = createSpecJsFunctions(undefined, pageSpec);
      const count = fns.count as (n: string) => Promise<number>;
      expect(await count("header")).toBe(0);
    });
  });
});
