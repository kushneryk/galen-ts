import type {
  Browser as PlaywrightBrowser,
  BrowserContext,
  Page as PlaywrightPage,
} from "playwright";
import { Browser, Size } from "./browser.js";
import { Page } from "../page/page.js";
import { PlaywrightPageAdapter } from "../page/playwright-page.js";

export class PlaywrightBrowserAdapter implements Browser {
  private pageAdapter: PlaywrightPageAdapter;

  constructor(
    private readonly browser: PlaywrightBrowser,
    private readonly context: BrowserContext,
    private readonly page: PlaywrightPage,
  ) {
    this.pageAdapter = new PlaywrightPageAdapter(page);
  }

  static async create(browser: PlaywrightBrowser): Promise<PlaywrightBrowserAdapter> {
    const context = await browser.newContext();
    const page = await context.newPage();
    return new PlaywrightBrowserAdapter(browser, context, page);
  }

  static async createWithPage(page: PlaywrightPage): Promise<PlaywrightBrowserAdapter> {
    const context = page.context();
    const browser = context.browser()!;
    return new PlaywrightBrowserAdapter(browser, context, page);
  }

  async load(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async changeWindowSize(size: Size): Promise<void> {
    await this.page.setViewportSize(size);
  }

  getPage(): Page {
    return this.pageAdapter;
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async getScreenSize(): Promise<Size> {
    const viewport = this.page.viewportSize();
    return viewport ?? { width: 1024, height: 768 };
  }

  async executeJavascript(script: string): Promise<unknown> {
    return await this.page.evaluate(script);
  }

  async refresh(): Promise<void> {
    await this.page.reload();
  }

  async quit(): Promise<void> {
    await this.context.close();
  }
}
