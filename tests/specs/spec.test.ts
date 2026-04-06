import { describe, it, expect } from "vitest";
import { Spec } from "../../src/specs/spec.js";
import { Place } from "../../src/specs/place.js";

class TestSpec extends Spec {}

describe("Spec", () => {
  it("toText returns alias when set", () => {
    const s = new TestSpec().withAlias("my alias");
    expect(s.toText()).toBe("my alias");
  });

  it("toText returns originalText when no alias", () => {
    const s = new TestSpec().withText("width 100px");
    expect(s.toText()).toBe("width 100px");
  });

  it("toText returns constructor name as fallback", () => {
    expect(new TestSpec().toText()).toBe("TestSpec");
  });

  it("withText sets originalText and returns this", () => {
    const s = new TestSpec();
    const result = s.withText("hello");
    expect(result).toBe(s);
    expect(s.originalText).toBe("hello");
  });

  it("withPlace sets place and returns this", () => {
    const s = new TestSpec();
    const place = new Place("f.gspec", 1);
    expect(s.withPlace(place)).toBe(s);
    expect(s.place).toBe(place);
  });

  it("withOnlyWarn sets onlyWarn to true", () => {
    const s = new TestSpec().withOnlyWarn();
    expect(s.onlyWarn).toBe(true);
  });

  it("withAlias sets alias", () => {
    const s = new TestSpec().withAlias("test");
    expect(s.alias).toBe("test");
  });

  it("withProperties stores properties", () => {
    const s = new TestSpec().withProperties({ key: "val" });
    expect(s.properties).toEqual({ key: "val" });
  });

  it("withJsVariables stores variables", () => {
    const s = new TestSpec().withJsVariables({ x: 1 });
    expect(s.jsVariables).toEqual({ x: 1 });
  });

  it("onlyWarn defaults to false", () => {
    expect(new TestSpec().onlyWarn).toBe(false);
  });
});
