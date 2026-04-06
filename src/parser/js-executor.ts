import { Page } from "../page/page.js";
import { Locator, LocatorType } from "../specs/page/locator.js";
import { PageSpec } from "../specs/page/page-spec.js";
import { Rect } from "../page/rect.js";

/**
 * Provides JavaScript helper functions available within .gspec files.
 * These are injected into the VarsParser context so that ${...} expressions
 * can call isVisible(), count(), find(), etc.
 */
export function createSpecJsFunctions(
  page: Page | undefined,
  pageSpec: PageSpec,
): Record<string, unknown> {
  const functions: Record<string, unknown> = {};

  functions.isVisible = async (objectName: string): Promise<boolean> => {
    if (!page) return false;
    const locator = pageSpec.getObjectLocator(objectName);
    if (!locator) return false;
    try {
      const element = await page.getObject(objectName, locator);
      return await element.isVisible();
    } catch {
      return false;
    }
  };

  functions.isPresent = async (objectName: string): Promise<boolean> => {
    if (!page) return false;
    const locator = pageSpec.getObjectLocator(objectName);
    if (!locator) return false;
    try {
      const element = await page.getObject(objectName, locator);
      return await element.isPresent();
    } catch {
      return false;
    }
  };

  functions.count = async (objectName: string): Promise<number> => {
    if (!page) return 0;
    const locator = pageSpec.getObjectLocator(objectName);
    if (!locator) return 0;
    try {
      return await page.getObjectCount(locator);
    } catch {
      return 0;
    }
  };

  /**
   * Creates a rich object wrapper with .left(), .right(), .top(), .bottom(),
   * .width(), .height() methods for use in JS expressions.
   */
  function createRichObject(objectName: string) {
    return {
      name: objectName,
      left: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.left;
      },
      right: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.left + area.width;
      },
      top: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.top;
      },
      bottom: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.top + area.height;
      },
      width: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.width;
      },
      height: async () => {
        if (!page) return 0;
        const locator = pageSpec.getObjectLocator(objectName);
        if (!locator) return 0;
        const element = await page.getObject(objectName, locator);
        const area = await element.getArea();
        return area.height;
      },
    };
  }

  functions.find = (pattern: string): ReturnType<typeof createRichObject>[] => {
    const names = pageSpec.findMatchingObjectNames(pattern);
    return names.map((name) => createRichObject(name));
  };

  functions.findAll = functions.find;

  functions.first = (pattern: string): ReturnType<typeof createRichObject> | null => {
    const matches = pageSpec.findMatchingObjectNames(pattern);
    return matches.length > 0 ? createRichObject(matches[0]) : null;
  };

  functions.last = (pattern: string): ReturnType<typeof createRichObject> | null => {
    const matches = pageSpec.findMatchingObjectNames(pattern);
    return matches.length > 0 ? createRichObject(matches[matches.length - 1]) : null;
  };

  // viewport and screen objects with .width() and .height()
  functions.viewport = {
    width: async () => {
      if (!page) return 1024;
      const special = await page.getObject("viewport", new Locator(LocatorType.CSS, "body"));
      const area = await special.getArea();
      return area.width;
    },
    height: async () => {
      if (!page) return 768;
      const special = await page.getObject("viewport", new Locator(LocatorType.CSS, "body"));
      const area = await special.getArea();
      return area.height;
    },
  };

  functions.screen = {
    width: async () => {
      if (!page) return 1024;
      const special = await page.getObject("screen", new Locator(LocatorType.CSS, "body"));
      const area = await special.getArea();
      return area.width;
    },
    height: async () => {
      if (!page) return 768;
      const special = await page.getObject("screen", new Locator(LocatorType.CSS, "body"));
      const area = await special.getArea();
      return area.height;
    },
  };

  return functions;
}
