import { describe, it, expect } from "vitest";
import { SpecText, SpecCss, TextCheckType } from "../../../src/specs/specs.js";
import { Rect } from "../../../src/page/rect.js";
import { PageSpec } from "../../../src/specs/page/page-spec.js";
import { Locator } from "../../../src/specs/page/locator.js";
import { buildPageValidation } from "../../helpers/mock-page-element.js";

function setup(text: string, css: Record<string, string> = {}) {
  const ps = new PageSpec();
  ps.addObject("el", Locator.css(".el"));
  return buildPageValidation({ el: { rect: new Rect(0, 0, 100, 50), text, css } }, ps);
}

describe("SpecValidationText", () => {
  it("passes for IS with matching text", async () => {
    const pv = setup("Hello World");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "Hello World"));
    expect(r.error).toBeUndefined();
  });

  it("fails for IS with non-matching text", async () => {
    const pv = setup("Hello");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "World"));
    expect(r.error).toBeDefined();
  });

  it("passes for CONTAINS", async () => {
    const pv = setup("Hello World");
    const r = await pv.check("el", new SpecText(TextCheckType.CONTAINS, "World"));
    expect(r.error).toBeUndefined();
  });

  it("passes for STARTS", async () => {
    const pv = setup("Hello World");
    const r = await pv.check("el", new SpecText(TextCheckType.STARTS, "Hello"));
    expect(r.error).toBeUndefined();
  });

  it("passes for ENDS", async () => {
    const pv = setup("Hello World");
    const r = await pv.check("el", new SpecText(TextCheckType.ENDS, "World"));
    expect(r.error).toBeUndefined();
  });

  it("passes for MATCHES regex", async () => {
    const pv = setup("item-123");
    const r = await pv.check("el", new SpecText(TextCheckType.MATCHES, "item-\\d+"));
    expect(r.error).toBeUndefined();
  });

  it("applies lowercase operation", async () => {
    const pv = setup("HELLO");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "hello", ["lowercase"]));
    expect(r.error).toBeUndefined();
  });

  it("applies uppercase operation", async () => {
    const pv = setup("hello");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "HELLO", ["uppercase"]));
    expect(r.error).toBeUndefined();
  });

  it("applies trim operation", async () => {
    const pv = setup("  hello  ");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "hello", ["trim"]));
    expect(r.error).toBeUndefined();
  });

  it("applies singleline operation", async () => {
    const pv = setup("hello\nworld");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "hello world", ["singleline"]));
    expect(r.error).toBeUndefined();
  });

  it("applies chained operations", async () => {
    const pv = setup("  HELLO  ");
    const r = await pv.check("el", new SpecText(TextCheckType.IS, "hello", ["trim", "lowercase"]));
    expect(r.error).toBeUndefined();
  });
});

describe("SpecValidationCss", () => {
  it("passes for matching CSS value", async () => {
    const pv = setup("", { "font-size": "14px" });
    const r = await pv.check("el", new SpecCss("font-size", TextCheckType.IS, "14px"));
    expect(r.error).toBeUndefined();
  });

  it("fails for non-matching CSS value", async () => {
    const pv = setup("", { "font-size": "16px" });
    const r = await pv.check("el", new SpecCss("font-size", TextCheckType.IS, "14px"));
    expect(r.error).toBeDefined();
  });
});
