import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Page } from "../page/page.js";
import { PageSpec } from "../specs/page/page-spec.js";
import { Locator, LocatorType } from "../specs/page/locator.js";
import { StructNode } from "./struct-node.js";
import { IndentationStructureParser } from "./indentation-structure-parser.js";
import { SpecReader } from "./spec-reader.js";
import { VarsParser, type VarsContext } from "./vars-parser.js";
import { SyntaxError } from "./syntax-error.js";
import { Place } from "../specs/place.js";
import type { ObjectSpecs, PageSection } from "../specs/page/page-spec.js";

export interface SectionFilter {
  includedTags: string[];
  excludedTags: string[];
}

export interface PageSpecReaderOptions {
  page?: Page;
  sectionFilter?: SectionFilter;
  properties?: Record<string, string>;
  variables?: VarsContext;
  objects?: Map<string, Locator>;
}

export class PageSpecReader {
  private readonly parser = new IndentationStructureParser();
  private readonly specReader = new SpecReader();
  private readonly processedImports = new Set<string>();

  read(
    specText: string,
    sourcePath: string = "<inline>",
    options: PageSpecReaderOptions = {},
  ): PageSpec {
    const pageSpec = new PageSpec();
    const vars = new VarsParser(
      options.variables ?? {},
      options.properties ?? {},
    );

    // Pre-populate objects if provided
    if (options.objects) {
      for (const [name, locator] of options.objects) {
        pageSpec.addObject(name, locator);
      }
    }

    const nodes = this.parser.parse(specText, sourcePath);
    const contextPath = sourcePath === "<inline>" ? "." : dirname(sourcePath);

    this.processNodes(nodes, pageSpec, vars, contextPath, options);

    return pageSpec;
  }

  readFile(
    filePath: string,
    options: PageSpecReaderOptions = {},
  ): PageSpec {
    const absolutePath = resolve(filePath);
    const text = readFileSync(absolutePath, "utf-8");
    return this.read(text, absolutePath, options);
  }

  private processNodes(
    nodes: StructNode[],
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): void {
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      const processedName = vars.parse(node.name);

      if (processedName.startsWith("@")) {
        i += this.processDirective(
          processedName,
          node,
          nodes,
          i,
          pageSpec,
          vars,
          contextPath,
          options,
        );
      } else if (this.isSectionHeader(processedName)) {
        this.processSection(
          processedName,
          node,
          pageSpec,
          vars,
          contextPath,
          options,
        );
        i++;
      } else {
        // Could be a top-level object spec
        i++;
      }
    }
  }

  private processDirective(
    name: string,
    node: StructNode,
    nodes: StructNode[],
    index: number,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): number {
    const keyword = name.split(/\s+/)[0].toLowerCase();

    switch (keyword) {
      case "@objects":
        this.processObjects(node, pageSpec, vars);
        return 1;

      case "@set":
        this.processSet(name, node, vars);
        return 1;

      case "@groups":
        this.processGroups(node, pageSpec, vars);
        return 1;

      case "@import":
        this.processImport(name, node, pageSpec, vars, contextPath, options);
        return 1;

      case "@on":
        return this.processOnFilter(
          name,
          node,
          pageSpec,
          vars,
          contextPath,
          options,
        );

      case "@if":
        return this.processConditional(
          name,
          node,
          nodes,
          index,
          pageSpec,
          vars,
          contextPath,
          options,
        );

      case "@foreach":
      case "@for":
        this.processForLoop(
          name,
          node,
          pageSpec,
          vars,
          contextPath,
          options,
        );
        return 1;

      case "@rule":
        // Rules stored but not processed here (used in sections)
        return 1;

      case "@script":
        this.processScript(name, node, vars);
        return 1;

      case "@die":
        this.processDie(name, node);
        return 1;

      default:
        throw new SyntaxError(
          node.place,
          `Unknown directive: '${keyword}'`,
        );
    }
  }

  // --- @objects ---

  private processObjects(
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
  ): void {
    for (const child of node.childNodes) {
      this.processObjectDefinition(child, pageSpec, vars);
    }
  }

  private processObjectDefinition(
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    parentName?: string,
    parentLocator?: Locator,
  ): void {
    const processedLine = vars.parse(node.name);
    const parts = processedLine.trim().split(/\s+/);
    if (parts.length < 2 && !node.hasChildNodes()) {
      throw new SyntaxError(
        node.place,
        `Invalid object definition: '${processedLine}'`,
      );
    }

    let objectName = parts[0];
    if (parentName) {
      objectName = `${parentName}.${objectName}`;
    }

    // Check for multi-object pattern (contains *)
    if (objectName.includes("*") && parts.length >= 2) {
      this.processMultiObject(
        objectName,
        parts.slice(1).join(" "),
        node,
        pageSpec,
        vars,
        parentLocator,
      );
      return;
    }

    // Parse locator from remaining parts
    if (parts.length >= 2) {
      const locatorText = parts.slice(1).join(" ");
      const locator = this.parseLocator(locatorText, parentLocator);
      pageSpec.addObject(objectName, locator);
    }

    // Process child objects
    for (const child of node.childNodes) {
      const currentLocator = pageSpec.getObjectLocator(objectName);
      this.processObjectDefinition(
        child,
        pageSpec,
        vars,
        objectName,
        currentLocator,
      );
    }
  }

  private processMultiObject(
    namePattern: string,
    locatorText: string,
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    parentLocator?: Locator,
  ): void {
    const locator = this.parseLocator(locatorText, parentLocator);

    // Create indexed objects: button* becomes button1, button2, etc.
    // The actual count will be determined at runtime; for now create base locator
    // Store the pattern for later resolution
    const baseName = namePattern.replace("*", "");
    const baseLocator = locator;

    // For static definition, we create the base object
    pageSpec.addObject(namePattern, baseLocator);

    // Process child objects with the pattern
    for (const child of node.childNodes) {
      this.processObjectDefinition(
        child,
        pageSpec,
        vars,
        baseName,
        baseLocator,
      );
    }
  }

  private parseLocator(text: string, parent?: Locator): Locator {
    const trimmed = text.trim();

    // Check for explicit type prefix
    const match = trimmed.match(/^(css|xpath|id)\s+(.+)$/i);
    if (match) {
      const type = match[1].toLowerCase() as "css" | "xpath" | "id";
      const value = match[2].trim();
      const locatorType =
        type === "css"
          ? LocatorType.CSS
          : type === "xpath"
            ? LocatorType.XPATH
            : LocatorType.ID;

      const locator = new Locator(
        locatorType,
        type === "id" ? `#${value}` : value,
      );
      return parent ? locator.withParent(parent) : locator;
    }

    // Auto-detect
    if (trimmed.startsWith("/") || trimmed.startsWith("(")) {
      const locator = new Locator(LocatorType.XPATH, trimmed);
      return parent ? locator.withParent(parent) : locator;
    }

    const locator = new Locator(LocatorType.CSS, trimmed);
    return parent ? locator.withParent(parent) : locator;
  }

  // --- @set ---

  private processSet(
    name: string,
    node: StructNode,
    vars: VarsParser,
  ): void {
    // Inline form: @set varName value
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 3) {
      const varName = parts[1];
      const value = parts.slice(2).join(" ");
      this.validateVariableName(varName, node.place);
      vars.setVariable(varName, vars.parse(value));
    }

    // Block form
    for (const child of node.childNodes) {
      const line = vars.parse(child.name).trim();
      const childParts = line.split(/\s+/);
      if (childParts.length >= 2) {
        const varName = childParts[0];
        const value = childParts.slice(1).join(" ");
        this.validateVariableName(varName, child.place);
        vars.setVariable(varName, value);
      }
    }
  }

  private validateVariableName(name: string, place?: Place): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new SyntaxError(
        place,
        `Invalid variable name: '${name}'`,
      );
    }
  }

  // --- @groups ---

  private processGroups(
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
  ): void {
    for (const child of node.childNodes) {
      const line = vars.parse(child.name).trim();

      let groupNames: string[];
      let objectStatement: string;

      if (line.startsWith("(")) {
        // Multiple groups: (group1, group2) objectPattern
        const closeParen = line.indexOf(")");
        if (closeParen < 0) {
          throw new SyntaxError(
            child.place,
            "Missing closing parenthesis in group definition",
          );
        }
        groupNames = line
          .substring(1, closeParen)
          .split(",")
          .map((s) => s.trim());
        objectStatement = line.substring(closeParen + 1).trim();
      } else {
        // Single group: groupName objectPattern
        const parts = line.split(/\s+/);
        groupNames = [parts[0]];
        objectStatement = parts.slice(1).join(" ");
      }

      const objectNames = this.findMatchingObjects(objectStatement, pageSpec);
      for (const groupName of groupNames) {
        const existing = pageSpec.findObjectsInGroup(groupName);
        const merged = [...new Set([...existing, ...objectNames])];
        pageSpec.addObjectGroup(groupName, merged);
      }
    }
  }

  private findMatchingObjects(
    statement: string,
    pageSpec: PageSpec,
  ): string[] {
    const patterns = statement.split(",").map((s) => s.trim());
    const result: string[] = [];
    for (const pattern of patterns) {
      result.push(...pageSpec.findMatchingObjectNames(pattern));
    }
    return result;
  }

  // --- @import ---

  private processImport(
    name: string,
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): void {
    const paths: string[] = [];

    // Inline: @import path/to/file.gspec
    const inlinePath = name.replace(/^@import\s+/, "").trim();
    if (inlinePath) {
      paths.push(inlinePath);
    }

    // Block form
    for (const child of node.childNodes) {
      paths.push(vars.parse(child.name).trim());
    }

    for (const importPath of paths) {
      const fullPath = resolve(contextPath, importPath);
      const fileId = fullPath;

      if (this.processedImports.has(fileId)) continue;
      this.processedImports.add(fileId);

      if (!existsSync(fullPath)) {
        throw new SyntaxError(
          node.place,
          `Cannot find imported file: '${fullPath}'`,
        );
      }

      const text = readFileSync(fullPath, "utf-8");
      const childNodes = this.parser.parse(text, fullPath);
      const childContextPath = dirname(fullPath);

      this.processNodes(childNodes, pageSpec, vars, childContextPath, options);
    }
  }

  // --- @on (tag filtering) ---

  private processOnFilter(
    name: string,
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): number {
    const tagText = name.replace(/^@on\s+/, "").trim();
    const tags = tagText.split(",").map((s) => s.trim());

    const filter = options.sectionFilter;
    if (filter) {
      // Check if any tag is excluded
      for (const tag of tags) {
        if (filter.excludedTags.includes(tag)) {
          return 1; // Skip this block
        }
      }

      // Check if any tag matches (or wildcard)
      let matches = false;
      for (const tag of tags) {
        if (tag === "*" || filter.includedTags.includes(tag)) {
          matches = true;
          break;
        }
      }

      if (!matches && filter.includedTags.length > 0) {
        return 1; // Skip — no matching tags
      }
    }

    // Process children
    this.processNodes(node.childNodes, pageSpec, vars, contextPath, options);
    return 1;
  }

  // --- @if / @elseif / @else ---

  private processConditional(
    name: string,
    node: StructNode,
    nodes: StructNode[],
    index: number,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): number {
    const elseIfNodes: StructNode[] = [];
    let elseNode: StructNode | null = null;
    let consumed = 1;

    // Collect @elseif and @else
    let j = index + 1;
    while (j < nodes.length) {
      const nextName = vars.parse(nodes[j].name).trim();
      const keyword = nextName.split(/\s+/)[0].toLowerCase();

      if (keyword === "@elseif") {
        elseIfNodes.push(nodes[j]);
        consumed++;
        j++;
      } else if (keyword === "@else") {
        elseNode = nodes[j];
        consumed++;
        break;
      } else {
        break;
      }
    }

    // Evaluate conditions
    const ifCondition = this.evaluateCondition(name, vars);
    if (ifCondition) {
      this.processNodes(
        node.childNodes,
        pageSpec,
        vars,
        contextPath,
        options,
      );
      return consumed;
    }

    for (const elseIfNode of elseIfNodes) {
      const condition = this.evaluateCondition(
        vars.parse(elseIfNode.name),
        vars,
      );
      if (condition) {
        this.processNodes(
          elseIfNode.childNodes,
          pageSpec,
          vars,
          contextPath,
          options,
        );
        return consumed;
      }
    }

    if (elseNode) {
      this.processNodes(
        elseNode.childNodes,
        pageSpec,
        vars,
        contextPath,
        options,
      );
    }

    return consumed;
  }

  private evaluateCondition(
    text: string,
    vars: VarsParser,
  ): boolean {
    // Extract expression after @if or @elseif
    const match = text.match(/^@(?:else)?if\s+(.+)$/i);
    if (!match) return false;

    const expression = vars.parse(match[1]).trim();
    return expression === "true" || expression === "1";
  }

  // --- @forEach / @for ---

  private processForLoop(
    name: string,
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): void {
    const isSimple = name.toLowerCase().startsWith("@for ");
    const processedName = vars.parse(name);

    // Parse sequence: [items] or [range]
    const bracketStart = processedName.indexOf("[");
    const bracketEnd = processedName.indexOf("]");
    if (bracketStart < 0 || bracketEnd < 0) {
      throw new SyntaxError(
        node.place,
        "Expected [...] in for/forEach",
      );
    }

    const sequenceText = processedName
      .substring(bracketStart + 1, bracketEnd)
      .trim();

    // Parse variable mappings: "as varName, prev as prevVar, next as nextVar, index as idxVar"
    const afterBracket = processedName.substring(bracketEnd + 1).trim();
    const mappings = this.parseForMappings(afterBracket);

    // Build sequence
    let sequence: string[];
    if (isSimple) {
      sequence = this.parseSimpleSequence(sequenceText);
    } else {
      sequence = this.parseForEachSequence(sequenceText, pageSpec);
    }

    // Execute loop
    const begin = mappings.prevVar ? 1 : 0;
    const end = mappings.nextVar ? sequence.length - 1 : sequence.length;

    for (let i = begin; i < end; i++) {
      vars.setVariable(mappings.mainVar, sequence[i]);
      if (mappings.prevVar) {
        vars.setVariable(mappings.prevVar, sequence[i - 1]);
      }
      if (mappings.nextVar) {
        vars.setVariable(mappings.nextVar, sequence[i + 1]);
      }
      if (mappings.indexVar) {
        vars.setVariable(mappings.indexVar, String(i - begin + 1));
      }

      // Re-parse and process children with current variables
      const childCopies = node.childNodes.map((child) =>
        this.deepCopyNode(child),
      );
      this.processNodes(childCopies, pageSpec, vars, contextPath, options);
    }
  }

  private parseForMappings(text: string): {
    mainVar: string;
    prevVar?: string;
    nextVar?: string;
    indexVar?: string;
  } {
    // "as item, prev as prevItem, next as nextItem, index as idx"
    const result: {
      mainVar: string;
      prevVar?: string;
      nextVar?: string;
      indexVar?: string;
    } = { mainVar: "item" };

    const parts = text.split(",").map((s) => s.trim());
    for (const part of parts) {
      const tokens = part.split(/\s+/);
      if (tokens[0] === "as" && tokens[1]) {
        result.mainVar = tokens[1];
      } else if (tokens[0] === "prev" && tokens[1] === "as" && tokens[2]) {
        result.prevVar = tokens[2];
      } else if (tokens[0] === "next" && tokens[1] === "as" && tokens[2]) {
        result.nextVar = tokens[2];
      } else if (tokens[0] === "index" && tokens[1] === "as" && tokens[2]) {
        result.indexVar = tokens[2];
      }
    }

    return result;
  }

  private parseSimpleSequence(text: string): string[] {
    const result: string[] = [];
    const parts = text.split(",").map((s) => s.trim());

    for (const part of parts) {
      const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        for (let i = start; i <= end; i++) {
          result.push(String(i));
        }
      } else {
        result.push(part);
      }
    }

    return result;
  }

  private parseForEachSequence(
    text: string,
    pageSpec: PageSpec,
  ): string[] {
    const patterns = text.split(",").map((s) => s.trim());
    const result: string[] = [];
    for (const pattern of patterns) {
      result.push(...pageSpec.findMatchingObjectNames(pattern));
    }
    return result;
  }

  private deepCopyNode(node: StructNode): StructNode {
    const copy = new StructNode(node.name, node.place);
    copy.childNodes = node.childNodes.map((child) =>
      this.deepCopyNode(child),
    );
    return copy;
  }

  // --- @script ---

  private processScript(
    name: string,
    node: StructNode,
    vars: VarsParser,
  ): void {
    if (node.hasChildNodes()) {
      // Inline script
      const scriptLines = node.childNodes.map((c) => c.name);
      const script = scriptLines.join("\n");
      // Execute with current vars as context
      const ctx = vars.context;
      const fn = new Function(...Object.keys(ctx), script);
      try {
        fn(...Object.values(ctx));
      } catch (e) {
        throw new SyntaxError(
          node.place,
          `Script error: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  // --- @die ---

  private processDie(name: string, node: StructNode): never {
    const message = name.replace(/^@die\s+/, "").trim();
    const unquoted =
      message.startsWith('"') && message.endsWith('"')
        ? message.slice(1, -1)
        : message;
    throw new SyntaxError(node.place, unquoted);
  }

  // --- Sections ---

  private isSectionHeader(text: string): boolean {
    return /^=+[^=].*=+$/.test(text.trim());
  }

  private processSection(
    name: string,
    node: StructNode,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
    options: PageSpecReaderOptions,
  ): void {
    // Extract section name: = Section Name = → "Section Name"
    const match = name.match(/^(=+)\s*(.*?)\s*=+$/);
    const sectionName = match ? match[2] : name;

    const section: PageSection = {
      name: sectionName,
      place: node.place
        ? { filePath: node.place.filePath, lineNumber: node.place.lineNumber }
        : undefined,
      objects: [],
      sections: [],
    };

    // Process children: either sub-sections, object specs, or rules
    for (const child of node.childNodes) {
      const childName = vars.parse(child.name).trim();

      if (this.isSectionHeader(childName)) {
        // Subsection
        this.processSection(
          childName,
          child,
          pageSpec,
          vars,
          contextPath,
          options,
        );
      } else if (childName.endsWith(":")) {
        // Object specs
        this.processObjectSpecs(
          childName,
          child,
          section,
          pageSpec,
          vars,
          contextPath,
        );
      } else if (childName.startsWith("|")) {
        // Rule invocation — would require rule registry
        // For now, skip
      } else if (childName.startsWith("@")) {
        // Directive inside section
        this.processNodes(
          [child],
          pageSpec,
          vars,
          contextPath,
          options,
        );
      }
    }

    pageSpec.addSection(section);
  }

  private processObjectSpecs(
    name: string,
    node: StructNode,
    section: PageSection,
    pageSpec: PageSpec,
    vars: VarsParser,
    contextPath: string,
  ): void {
    // Remove trailing colon
    const objectExpression = name.slice(0, -1).trim();

    // Find matching objects (supports patterns)
    const objectNames = pageSpec.findMatchingObjectNames(objectExpression);
    const names =
      objectNames.length > 0 ? objectNames : [objectExpression];

    for (const objectName of names) {
      const objectSpecs: ObjectSpecs = {
        objectName,
        specs: [],
        specGroups: [],
      };

      for (const specNode of node.childNodes) {
        let specText = vars.parse(specNode.name).trim();

        // Warning-only prefix
        let onlyWarn = false;
        if (specText.startsWith("%")) {
          onlyWarn = true;
          specText = specText.substring(1).trim();
        }

        // Alias prefix
        let alias: string | undefined;
        if (specText.startsWith('"')) {
          const endQuote = specText.indexOf('"', 1);
          if (endQuote > 0) {
            alias = specText.substring(1, endQuote);
            specText = specText.substring(endQuote + 1).trim();
          }
        }

        try {
          const spec = this.specReader.read(specText, contextPath);
          if (onlyWarn) spec.withOnlyWarn();
          if (alias) spec.withAlias(alias);
          if (specNode.place) spec.withPlace(specNode.place);
          objectSpecs.specs.push(spec);
        } catch (e) {
          throw new SyntaxError(
            specNode.place,
            `Error parsing spec '${specText}': ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      section.objects.push(objectSpecs);
    }
  }
}
