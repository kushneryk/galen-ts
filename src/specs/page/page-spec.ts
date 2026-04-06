import { Spec } from "../spec.js";
import { Locator } from "./locator.js";

export interface SpecGroup {
  name: string;
  specs: Spec[];
}

export interface ObjectSpecs {
  objectName: string;
  specs: Spec[];
  specGroups: SpecGroup[];
}

export interface PageSection {
  name: string;
  place?: { filePath: string; lineNumber: number };
  objects: ObjectSpecs[];
  sections: PageSection[];
}

export class PageSpec {
  readonly objects = new Map<string, Locator>();
  readonly sections: PageSection[] = [];
  readonly objectGroups = new Map<string, string[]>();

  addObject(name: string, locator: Locator): void {
    this.objects.set(name, locator);
  }

  getObjectLocator(name: string): Locator | undefined {
    return this.objects.get(name);
  }

  addSection(section: PageSection): void {
    this.sections.push(section);
  }

  addObjectGroup(groupName: string, objectNames: string[]): void {
    this.objectGroups.set(groupName, objectNames);
  }

  findObjectsInGroup(groupName: string): string[] {
    return this.objectGroups.get(groupName) ?? [];
  }

  getSortedObjectNames(): string[] {
    return [...this.objects.keys()].sort();
  }

  findMatchingObjectNames(pattern: string): string[] {
    // Group reference: &groupName
    if (pattern.startsWith("&")) {
      const groupName = pattern.substring(1);
      return this.findObjectsInGroup(groupName);
    }

    // No wildcards — exact match
    if (!pattern.includes("*") && !pattern.includes("#")) {
      return this.objects.has(pattern) ? [pattern] : [];
    }

    // Build regex: * → .*, # → [0-9]+
    const regexStr = "^" + pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex special chars (except * and #)
      .replace(/\*/g, ".*")
      .replace(/#/g, "[0-9]+") + "$";
    const regex = new RegExp(regexStr);
    return [...this.objects.keys()].filter((name) => regex.test(name));
  }

  addSpec(objectName: string, spec: Spec): void {
    for (const section of this.sections) {
      for (const obj of section.objects) {
        if (obj.objectName === objectName) {
          obj.specs.push(spec);
          return;
        }
      }
    }
    // Create a new default section if none exists
    const objectSpecs: ObjectSpecs = {
      objectName,
      specs: [spec],
      specGroups: [],
    };
    if (this.sections.length === 0) {
      this.sections.push({ name: "", objects: [], sections: [] });
    }
    this.sections[0].objects.push(objectSpecs);
  }

  merge(other: PageSpec): void {
    for (const [name, locator] of other.objects) {
      this.objects.set(name, locator);
    }
    for (const section of other.sections) {
      this.sections.push(section);
    }
    for (const [groupName, names] of other.objectGroups) {
      this.objectGroups.set(groupName, names);
    }
  }
}
