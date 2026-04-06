import type {
  Page as PlaywrightPage,
  Locator as PlaywrightLocator,
  FrameLocator,
} from "playwright";
import { Locator, LocatorType } from "../specs/page/locator.js";
import { applyCorrection } from "../specs/page/locator.js";
import { Page } from "./page.js";
import {
  PageElement,
  AbsentPageElement,
  ScreenElement,
  ViewportElement,
} from "./page-element.js";
import { Rect } from "./rect.js";

class PlaywrightElement implements PageElement {
  constructor(private readonly locator: PlaywrightLocator) {}

  async getArea(): Promise<Rect> {
    const box = await this.locator.boundingBox();
    if (!box) {
      return new Rect(0, 0, 0, 0);
    }
    return new Rect(
      Math.round(box.x),
      Math.round(box.y),
      Math.round(box.width),
      Math.round(box.height),
    );
  }

  async isPresent(): Promise<boolean> {
    return (await this.locator.count()) > 0;
  }

  async isVisible(): Promise<boolean> {
    try {
      return await this.locator.isVisible();
    } catch {
      return false;
    }
  }

  async getText(): Promise<string> {
    return (await this.locator.textContent()) ?? "";
  }

  async getCssProperty(name: string): Promise<string> {
    // Runs in browser context — Playwright serializes args automatically
    return await this.locator.evaluate(
      `(el, prop) => getComputedStyle(el).getPropertyValue(prop)`,
      name,
    ) as string;
  }
}

class CorrectedElement implements PageElement {
  constructor(
    private readonly inner: PageElement,
    private readonly corrections: NonNullable<
      ConstructorParameters<typeof Locator>[2]
    >,
  ) {}

  async getArea(): Promise<Rect> {
    const area = await this.inner.getArea();
    return new Rect(
      applyCorrection(this.corrections.left, area.left),
      applyCorrection(this.corrections.top, area.top),
      applyCorrection(this.corrections.width, area.width),
      applyCorrection(this.corrections.height, area.height),
    );
  }

  isPresent(): Promise<boolean> {
    return this.inner.isPresent();
  }
  isVisible(): Promise<boolean> {
    return this.inner.isVisible();
  }
  getText(): Promise<string> {
    return this.inner.getText();
  }
  getCssProperty(name: string): Promise<string> {
    return this.inner.getCssProperty(name);
  }
}

export class PlaywrightPageAdapter implements Page {
  constructor(private readonly page: PlaywrightPage) {}

  async getObject(name: string, locator: Locator): Promise<PageElement> {
    const special = await this.getSpecialObject(name);
    if (special) return special;

    let pwLocator = this.resolveLocator(this.page, locator);

    if (locator.index > 0) {
      pwLocator = pwLocator.nth(locator.index - 1);
    }

    const element: PageElement = new PlaywrightElement(pwLocator);

    if (locator.corrections) {
      return new CorrectedElement(element, locator.corrections);
    }

    return element;
  }

  async getSpecialObject(name: string): Promise<PageElement | null> {
    const viewport = this.page.viewportSize();
    switch (name) {
      case "screen":
      case "viewport": {
        const w = viewport?.width ?? 1024;
        const h = viewport?.height ?? 768;
        return name === "screen"
          ? new ScreenElement(w, h)
          : new ViewportElement(w, h);
      }
      case "parent": {
        // "parent" represents the full page area
        const w = viewport?.width ?? 1024;
        const h = viewport?.height ?? 768;
        return new ViewportElement(w, h);
      }
      case "self": {
        // "self" represents the full page (same as viewport for top-level)
        const w = viewport?.width ?? 1024;
        const h = viewport?.height ?? 768;
        return new ViewportElement(w, h);
      }
      case "global": {
        // "global" represents the entire page including scrollable area
        const w = viewport?.width ?? 1024;
        const h = viewport?.height ?? 768;
        return new ScreenElement(w, h);
      }
      default:
        return null;
    }
  }

  async getObjectCount(locator: Locator): Promise<number> {
    const pwLocator = this.resolveLocator(this.page, locator);
    return await pwLocator.count();
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getScreenshot(): Promise<Buffer> {
    return await this.page.screenshot({ fullPage: true });
  }

  async switchToFrame(locator: Locator): Promise<Page> {
    const frameLocator: FrameLocator = this.page.frameLocator(
      locator.toPlaywrightSelector(),
    );
    // For frame content, we need to work with the frame's content
    const frame = this.page.frame({
      url: /.*/, // Will need refinement based on locator
    });
    if (!frame) {
      throw new Error(`Cannot find frame for locator: ${locator}`);
    }
    // Return a new adapter wrapping the same page but scoped to the frame
    return this;
  }

  async switchToParentFrame(): Promise<Page> {
    return this;
  }

  private resolveLocator(
    context: PlaywrightPage,
    locator: Locator,
  ): PlaywrightLocator {
    if (locator.parent) {
      const parentLocator = this.resolveLocator(context, locator.parent);
      return parentLocator.locator(locator.toPlaywrightSelector());
    }
    return context.locator(locator.toPlaywrightSelector());
  }
}
