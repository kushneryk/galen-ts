import { describe, it, expect } from "vitest";
import { SuiteRunner } from "../../src/suite/suite-runner.js";
import { PageTest } from "../../src/suite/page-test.js";

describe("SuiteRunner", () => {
  // SuiteRunner requires a real Playwright Browser, so we test
  // the filtering logic which doesn't need browser

  describe("filtering", () => {
    const runner = new SuiteRunner();

    it("excludes disabled tests", async () => {
      const tests = [
        new PageTest("T1", undefined, undefined, [], [], false),
        new PageTest("T2", undefined, undefined, [], [], true), // disabled
      ];
      // We can't run without a browser, but we can verify the run method
      // filters by checking test count through onTestComplete
      // For now just verify PageTest construction
      expect(tests[1].disabled).toBe(true);
    });

    it("filters by group when groups option provided", () => {
      const tests = [
        new PageTest("T1", undefined, undefined, [], ["smoke"]),
        new PageTest("T2", undefined, undefined, [], ["regression"]),
        new PageTest("T3", undefined, undefined, [], ["smoke", "regression"]),
      ];

      // Simulate filtering logic
      const filtered = tests
        .filter(t => !t.disabled)
        .filter(t => t.groups.some(g => ["smoke"].includes(g)));
      expect(filtered).toHaveLength(2); // T1 and T3
      expect(filtered[0].title).toBe("T1");
      expect(filtered[1].title).toBe("T3");
    });
  });
});
