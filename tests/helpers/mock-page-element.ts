import { Rect } from "../../src/page/rect.js";
import { PageElement, ScreenElement, ViewportElement } from "../../src/page/page-element.js";
import { Page } from "../../src/page/page.js";
import { Locator } from "../../src/specs/page/locator.js";
import { PageSpec } from "../../src/specs/page/page-spec.js";
import { PageValidation } from "../../src/validation/page-validation.js";
import type { ValidationListener } from "../../src/validation/validation-result.js";

export interface MockElementOptions {
  present?: boolean;
  visible?: boolean;
  text?: string;
  cssProperties?: Record<string, string>;
}

export function mockElement(
  rect: Rect,
  opts: MockElementOptions = {},
): PageElement {
  const present = opts.present ?? true;
  const visible = opts.visible ?? true;
  const text = opts.text ?? "";
  const cssProperties = opts.cssProperties ?? {};

  return {
    async getArea() { return rect; },
    async isPresent() { return present; },
    async isVisible() { return visible; },
    async getText() { return text; },
    async getCssProperty(name: string) { return cssProperties[name] ?? ""; },
  };
}

export interface MockPageOptions {
  viewportWidth?: number;
  viewportHeight?: number;
}

export function mockPage(
  elements: Record<string, PageElement>,
  opts: MockPageOptions = {},
): Page {
  const vw = opts.viewportWidth ?? 1024;
  const vh = opts.viewportHeight ?? 768;

  return {
    async getObject(name: string, _locator: Locator): Promise<PageElement> {
      return elements[name] ?? mockElement(new Rect(0, 0, 0, 0), { present: false, visible: false });
    },
    async getSpecialObject(name: string): Promise<PageElement | null> {
      if (name === "screen") return new ScreenElement(vw, vh);
      if (name === "viewport") return new ViewportElement(vw, vh);
      return null;
    },
    async getObjectCount(_locator: Locator): Promise<number> {
      return Object.keys(elements).length;
    },
    async getTitle(): Promise<string> { return "Mock Page"; },
    async getScreenshot(): Promise<Buffer> { return Buffer.from("mock-screenshot"); },
    async switchToFrame(_locator: Locator): Promise<Page> { return this; },
    async switchToParentFrame(): Promise<Page> { return this; },
  };
}

export interface ElementConfig {
  rect: Rect;
  present?: boolean;
  visible?: boolean;
  text?: string;
  css?: Record<string, string>;
}

export function buildPageValidation(
  elements: Record<string, ElementConfig>,
  pageSpec: PageSpec,
  listener?: ValidationListener,
): PageValidation {
  const pageElements: Record<string, PageElement> = {};
  for (const [name, config] of Object.entries(elements)) {
    pageElements[name] = mockElement(config.rect, {
      present: config.present,
      visible: config.visible,
      text: config.text,
      cssProperties: config.css,
    });
  }

  const page = mockPage(pageElements);
  return new PageValidation(page, pageSpec, listener);
}
