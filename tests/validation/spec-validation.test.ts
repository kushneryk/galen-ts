import { describe, it, expect } from "vitest";
import { ValidationErrorException } from "../../src/validation/spec-validation.js";
import { SpecVisible } from "../../src/specs/specs.js";
import { Rect } from "../../src/page/rect.js";

describe("ValidationErrorException", () => {
  it("constructs with message", () => {
    const e = new ValidationErrorException("test error");
    expect(e.message).toBe("test error");
    expect(e.messages).toEqual(["test error"]);
  });

  it("constructs without message", () => {
    const e = new ValidationErrorException();
    expect(e.messages).toEqual([]);
  });

  it("withMessage appends to messages", () => {
    const e = new ValidationErrorException("first").withMessage("second");
    expect(e.messages).toEqual(["first", "second"]);
  });

  it("withObject appends to validationObjects", () => {
    const e = new ValidationErrorException();
    e.withObject({ name: "btn", area: new Rect(0, 0, 10, 10) });
    expect(e.validationObjects).toHaveLength(1);
    expect(e.validationObjects[0].name).toBe("btn");
  });

  it("withMeta appends to meta", () => {
    const e = new ValidationErrorException();
    e.withMeta([{ key: "k", value: "v" }]);
    expect(e.meta).toHaveLength(1);
  });

  it("asValidationResult creates correct result", () => {
    const spec = new SpecVisible();
    const e = new ValidationErrorException("err")
      .withObject({ name: "x" })
      .withMeta([{ key: "a", value: "b" }]);
    const r = e.asValidationResult(spec);
    expect(r.spec).toBe(spec);
    expect(r.error?.messages).toEqual(["err"]);
    expect(r.objects).toHaveLength(1);
    expect(r.meta).toHaveLength(1);
  });

  it('has name "ValidationErrorException"', () => {
    expect(new ValidationErrorException().name).toBe("ValidationErrorException");
  });
});
