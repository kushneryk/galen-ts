import { describe, it, expect } from "vitest";
import { AbsentPageElement, ScreenElement, ViewportElement } from "../../src/page/page-element.js";

describe("AbsentPageElement", () => {
  const el = new AbsentPageElement();

  it("getArea returns 0,0,0,0 rect", async () => {
    const area = await el.getArea();
    expect(area.left).toBe(0);
    expect(area.top).toBe(0);
    expect(area.width).toBe(0);
    expect(area.height).toBe(0);
  });

  it("isPresent returns false", async () => {
    expect(await el.isPresent()).toBe(false);
  });

  it("isVisible returns false", async () => {
    expect(await el.isVisible()).toBe(false);
  });

  it("getText returns empty string", async () => {
    expect(await el.getText()).toBe("");
  });

  it("getCssProperty returns empty string", async () => {
    expect(await el.getCssProperty("color")).toBe("");
  });
});

describe("ScreenElement", () => {
  const el = new ScreenElement(1920, 1080);

  it("getArea returns rect with given dimensions", async () => {
    const area = await el.getArea();
    expect(area.left).toBe(0);
    expect(area.top).toBe(0);
    expect(area.width).toBe(1920);
    expect(area.height).toBe(1080);
  });

  it("isPresent returns true", async () => expect(await el.isPresent()).toBe(true));
  it("isVisible returns true", async () => expect(await el.isVisible()).toBe(true));
  it("getText returns empty string", async () => expect(await el.getText()).toBe(""));
});

describe("ViewportElement", () => {
  const el = new ViewportElement(1024, 768);

  it("getArea returns rect with given dimensions", async () => {
    const area = await el.getArea();
    expect(area.width).toBe(1024);
    expect(area.height).toBe(768);
  });

  it("isPresent returns true", async () => expect(await el.isPresent()).toBe(true));
  it("isVisible returns true", async () => expect(await el.isVisible()).toBe(true));
});
