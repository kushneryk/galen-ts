import { describe, it, expect } from "vitest";
import { PageTest } from "../../src/suite/page-test.js";

describe("PageTest", () => {
  it("constructs with all properties", () => {
    const t = new PageTest("Login Test", "http://example.com", { width: 1024, height: 768 }, [], ["smoke"], true);
    expect(t.title).toBe("Login Test");
    expect(t.url).toBe("http://example.com");
    expect(t.size).toEqual({ width: 1024, height: 768 });
    expect(t.groups).toEqual(["smoke"]);
    expect(t.disabled).toBe(true);
  });

  it("actions defaults to empty array", () => {
    expect(new PageTest("T").actions).toEqual([]);
  });

  it("groups defaults to empty array", () => {
    expect(new PageTest("T").groups).toEqual([]);
  });

  it("disabled defaults to false", () => {
    expect(new PageTest("T").disabled).toBe(false);
  });
});
