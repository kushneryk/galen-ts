import { describe, it, expect, vi } from "vitest";
import { CombinedValidationListener } from "../../src/reports/combined-listener.js";
import { SpecVisible } from "../../src/specs/specs.js";
import type { ValidationListener } from "../../src/validation/validation-result.js";

function createMockListener(): ValidationListener & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    onBeforeObjectValidation() { calls.push("beforeObj"); },
    onAfterObjectValidation() { calls.push("afterObj"); },
    onBeforeSection() { calls.push("beforeSection"); },
    onAfterSection() { calls.push("afterSection"); },
  };
}

describe("CombinedValidationListener", () => {
  it("delegates all methods to all listeners", () => {
    const l1 = createMockListener();
    const l2 = createMockListener();
    const combined = new CombinedValidationListener([l1, l2]);
    const spec = new SpecVisible();

    combined.onBeforeSection("S");
    combined.onBeforeObjectValidation("x", spec);
    combined.onAfterObjectValidation("x", spec, { spec, objects: [], meta: [], warnings: [] });
    combined.onAfterSection("S");

    expect(l1.calls).toEqual(["beforeSection", "beforeObj", "afterObj", "afterSection"]);
    expect(l2.calls).toEqual(["beforeSection", "beforeObj", "afterObj", "afterSection"]);
  });
});
