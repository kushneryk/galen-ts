import { Locator } from "../specs/page/locator.js";
import { PageElement } from "./page-element.js";

export interface Page {
  getObject(name: string, locator: Locator): Promise<PageElement>;
  getSpecialObject(name: string): Promise<PageElement | null>;
  getObjectCount(locator: Locator): Promise<number>;
  getTitle(): Promise<string>;
  getScreenshot(): Promise<Buffer>;
  switchToFrame(locator: Locator): Promise<Page>;
  switchToParentFrame(): Promise<Page>;
}
