import type { Page as PlaywrightPage } from "playwright";
import { Galen } from "../api/galen.js";
import type { CheckLayoutOptions } from "../api/galen.js";
import { LayoutReport } from "../reports/layout-report.js";

export interface PageActionResult {
  action: string;
  layoutReport?: LayoutReport;
  error?: string;
}

export abstract class PageAction {
  constructor(public readonly originalCommand: string) {}

  abstract execute(page: PlaywrightPage): Promise<PageActionResult>;
}

export class PageActionOpen extends PageAction {
  constructor(public readonly url: string) {
    super(`open ${url}`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    await page.goto(this.url);
    return { action: this.originalCommand };
  }
}

export class PageActionResize extends PageAction {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    super(`resize ${width}x${height}`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    await page.setViewportSize({
      width: this.width,
      height: this.height,
    });
    return { action: this.originalCommand };
  }
}

export class PageActionCheck extends PageAction {
  constructor(
    public readonly specPath: string,
    public readonly options: CheckLayoutOptions = {},
  ) {
    super(`check ${specPath}`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    const report = await Galen.checkLayout(page, this.specPath, this.options);
    return {
      action: this.originalCommand,
      layoutReport: report,
    };
  }
}

export class PageActionRunJavascript extends PageAction {
  constructor(
    public readonly script: string,
    public readonly args: Record<string, unknown> = {},
  ) {
    super(`run ${script}`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    await page.evaluate(this.script);
    return { action: this.originalCommand };
  }
}

export class PageActionWait extends PageAction {
  constructor(public readonly milliseconds: number) {
    super(`wait ${milliseconds}ms`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    await page.waitForTimeout(this.milliseconds);
    return { action: this.originalCommand };
  }
}

export class PageActionInjectJavascript extends PageAction {
  constructor(public readonly scriptPath: string) {
    super(`inject ${scriptPath}`);
  }

  async execute(page: PlaywrightPage): Promise<PageActionResult> {
    await page.addScriptTag({ path: this.scriptPath });
    return { action: this.originalCommand };
  }
}
