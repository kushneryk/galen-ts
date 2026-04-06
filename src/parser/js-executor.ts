import { Page } from "../page/page.js";
import { Locator, LocatorType } from "../specs/page/locator.js";
import { PageSpec } from "../specs/page/page-spec.js";

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

  functions.find = (pattern: string): string[] => {
    return pageSpec.findMatchingObjectNames(pattern);
  };

  functions.findAll = functions.find;

  functions.first = (pattern: string): string | null => {
    const matches = pageSpec.findMatchingObjectNames(pattern);
    return matches.length > 0 ? matches[0] : null;
  };

  functions.last = (pattern: string): string | null => {
    const matches = pageSpec.findMatchingObjectNames(pattern);
    return matches.length > 0 ? matches[matches.length - 1] : null;
  };

  return functions;
}
