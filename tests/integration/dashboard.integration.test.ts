import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, Browser, Page } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Galen } from "../../src/api/galen.js";

const FIXTURES = resolve(import.meta.dirname, "../fixtures/dashboard");
const HTML_PATH = pathToFileURL(resolve(FIXTURES, "index.html")).href;

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

describe("Dashboard — Desktop (1440x900)", () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HTML_PATH);
    await page.waitForLoadState("networkidle");
  });

  afterAll(async () => {
    await page.close();
  });

  it("passes all desktop layout specs", async () => {
    const specPath = resolve(FIXTURES, "dashboard-desktop.gspec");
    const report = await Galen.checkLayout(page, specPath);

    const errors = collectErrors(report);
    expect(errors, `Dashboard desktop failures:\n${errors.join("\n")}`).toHaveLength(0);
  });
});

describe("Dashboard — Mobile (375x667)", () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HTML_PATH);
    await page.waitForLoadState("networkidle");
  });

  afterAll(async () => {
    await page.close();
  });

  it("passes all mobile layout specs", async () => {
    const specPath = resolve(FIXTURES, "dashboard-mobile.gspec");
    const report = await Galen.checkLayout(page, specPath);

    const errors = collectErrors(report);
    expect(errors, `Dashboard mobile failures:\n${errors.join("\n")}`).toHaveLength(0);
  });
});

function collectErrors(report: Awaited<ReturnType<typeof Galen.checkLayout>>): string[] {
  const errors: string[] = [];
  const visitSection = (s: (typeof report.sections)[number]) => {
    for (const obj of s.objects) {
      for (const spec of obj.specs) {
        if (spec.status === "error") {
          errors.push(`  [${obj.name}] ${spec.name}: ${spec.errors.join("; ")}`);
        }
      }
    }
    for (const sub of s.sections) visitSection(sub);
  };
  for (const section of report.sections) visitSection(section);
  return errors;
}
