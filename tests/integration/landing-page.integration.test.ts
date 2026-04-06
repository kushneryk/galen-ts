import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, Browser, Page } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Galen } from "../../src/api/galen.js";

const FIXTURES = resolve(import.meta.dirname, "../fixtures/landing-page");
const HTML_PATH = pathToFileURL(resolve(FIXTURES, "index.html")).href;

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

describe("Landing Page — Desktop (1280x800)", () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(HTML_PATH);
    await page.waitForLoadState("networkidle");
  });

  afterAll(async () => {
    await page.close();
  });

  it("passes all desktop layout specs", async () => {
    const specPath = resolve(FIXTURES, "landing-desktop.gspec");
    const report = await Galen.checkLayout(page, specPath);

    const errors = collectErrors(report);
    expect(errors, `Desktop layout failures:\n${errors.join("\n")}`).toHaveLength(0);
  });
});

describe("Landing Page — Mobile (375x667)", () => {
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
    const specPath = resolve(FIXTURES, "landing-mobile.gspec");
    const report = await Galen.checkLayout(page, specPath);

    const errors = collectErrors(report);
    expect(errors, `Mobile layout failures:\n${errors.join("\n")}`).toHaveLength(0);
  });
});

function collectErrors(report: ReturnType<typeof Galen.readSpecFromText> extends never ? never : Awaited<ReturnType<typeof Galen.checkLayout>>): string[] {
  const errors: string[] = [];
  for (const section of report.sections) {
    for (const obj of section.objects) {
      for (const spec of obj.specs) {
        if (spec.status === "error") {
          errors.push(`  [${obj.name}] ${spec.name}: ${spec.errors.join("; ")}`);
        }
      }
    }
    // Check nested sections too
    const visitSection = (s: typeof section) => {
      for (const obj of s.objects) {
        for (const spec of obj.specs) {
          if (spec.status === "error") {
            errors.push(`  [${obj.name}] ${spec.name}: ${spec.errors.join("; ")}`);
          }
        }
      }
      for (const sub of s.sections) visitSection(sub);
    };
    for (const sub of section.sections) visitSection(sub);
  }
  return errors;
}
