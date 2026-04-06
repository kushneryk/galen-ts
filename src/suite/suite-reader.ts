import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { PageTest } from "./page-test.js";
import {
  PageAction,
  PageActionOpen,
  PageActionResize,
  PageActionCheck,
  PageActionRunJavascript,
  PageActionWait,
  PageActionInjectJavascript,
} from "./page-action.js";

interface ParseContext {
  variables: Record<string, string>;
  groups: string[];
  disabled: boolean;
  contextPath: string;
}

export class SuiteReader {
  read(filePath: string): PageTest[] {
    const absolutePath = resolve(filePath);
    const text = readFileSync(absolutePath, "utf-8");
    return this.parse(text, dirname(absolutePath));
  }

  parse(text: string, contextPath: string = "."): PageTest[] {
    const lines = text.split("\n");
    const tests: PageTest[] = [];
    const ctx: ParseContext = {
      variables: {},
      groups: [],
      disabled: false,
      contextPath,
    };

    // Table data for parameterization
    const tables = new Map<string, string[][]>();
    let currentParameterized: {
      params: string[];
      rows: string[][];
    } | null = null;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty and comments
      if (trimmed === "" || trimmed.startsWith("#") || /^[-=]+$/.test(trimmed)) {
        i++;
        continue;
      }

      // Special instructions
      if (trimmed.startsWith("@@")) {
        const instruction = trimmed.substring(2).trim();
        const parts = instruction.split(/\s+/);
        const keyword = parts[0].toLowerCase();

        switch (keyword) {
          case "set": {
            const varName = parts[1];
            const varValue = parts.slice(2).join(" ");
            ctx.variables[varName] = varValue;
            break;
          }

          case "table": {
            const tableName = parts[1];
            const tableRows: string[][] = [];
            i++;
            while (i < lines.length) {
              const tableLine = lines[i].trim();
              if (tableLine === "" || !tableLine.includes("|")) break;
              tableRows.push(
                tableLine.split("|").map((c) => c.trim()),
              );
              i++;
            }
            tables.set(tableName, tableRows);
            continue; // Don't increment i again
          }

          case "parameterized": {
            const paramNames = instruction
              .substring("parameterized".length)
              .trim()
              .split(",")
              .map((p) => p.trim());
            const rows: string[][] = [];
            i++;
            while (i < lines.length) {
              const paramLine = lines[i].trim();
              if (paramLine === "" || !paramLine.includes("|")) break;
              rows.push(
                paramLine.split("|").map((c) => c.trim()),
              );
              i++;
            }
            currentParameterized = { params: paramNames, rows };
            continue;
          }

          case "disabled":
            ctx.disabled = true;
            break;

          case "groups":
            ctx.groups = parts.slice(1).join(" ").split(",").map((g) => g.trim());
            break;

          case "import": {
            const importPath = resolve(ctx.contextPath, parts.slice(1).join(" "));
            const importedTests = this.read(importPath);
            tests.push(...importedTests);
            break;
          }
        }

        i++;
        continue;
      }

      // Test definition [Test Title]
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const title = this.substituteVars(
          trimmed.slice(1, -1).trim(),
          ctx.variables,
        );

        // Collect actions (indented lines)
        const actions: PageAction[] = [];
        let url: string | undefined;
        let size: { width: number; height: number } | undefined;

        i++;
        while (i < lines.length) {
          const actionLine = lines[i];
          if (actionLine.trim() === "" || (!actionLine.startsWith(" ") && !actionLine.startsWith("\t"))) {
            break;
          }
          const actionTrimmed = this.substituteVars(
            actionLine.trim(),
            ctx.variables,
          );

          const action = this.parseAction(actionTrimmed, ctx.contextPath);
          if (action) {
            actions.push(action);
            if (action instanceof PageActionOpen) url = action.url;
            if (action instanceof PageActionResize) {
              size = { width: action.width, height: action.height };
            }
          }
          i++;
        }

        if (currentParameterized) {
          // Create parameterized tests
          for (const row of currentParameterized.rows) {
            const paramVars = { ...ctx.variables };
            for (let p = 0; p < currentParameterized.params.length; p++) {
              paramVars[currentParameterized.params[p]] = row[p] ?? "";
            }

            const paramTitle = this.substituteVars(title, paramVars);
            const paramActions = actions.map((a) => {
              const cmdSubst = this.substituteVars(a.originalCommand, paramVars);
              return this.parseAction(cmdSubst, ctx.contextPath) ?? a;
            });

            tests.push(
              new PageTest(
                paramTitle,
                url ? this.substituteVars(url, paramVars) : undefined,
                size,
                paramActions,
                [...ctx.groups],
                ctx.disabled,
              ),
            );
          }
          currentParameterized = null;
        } else {
          tests.push(
            new PageTest(title, url, size, actions, [...ctx.groups], ctx.disabled),
          );
        }

        // Reset per-test flags
        ctx.groups = [];
        ctx.disabled = false;
        continue;
      }

      i++;
    }

    return tests;
  }

  private parseAction(text: string, contextPath: string): PageAction | null {
    const parts = text.split(/\s+/);
    const keyword = parts[0].toLowerCase();

    switch (keyword) {
      case "open":
        return new PageActionOpen(parts.slice(1).join(" "));

      case "resize": {
        const sizeText = parts.slice(1).join(" ");
        const match = sizeText.match(/(\d+)\s*[x×]\s*(\d+)/i) ??
          sizeText.match(/(\d+)\s+(\d+)/);
        if (match) {
          return new PageActionResize(
            parseInt(match[1], 10),
            parseInt(match[2], 10),
          );
        }
        return null;
      }

      case "check": {
        const specPath = resolve(contextPath, parts[1]);
        const tags: string[] = [];
        const excludeTags: string[] = [];

        for (let j = 2; j < parts.length; j++) {
          if (parts[j] === "--include") {
            j++;
            if (j < parts.length) tags.push(...parts[j].split(","));
          } else if (parts[j] === "--exclude") {
            j++;
            if (j < parts.length) excludeTags.push(...parts[j].split(","));
          }
        }

        return new PageActionCheck(specPath, {
          sectionFilter:
            tags.length > 0 || excludeTags.length > 0
              ? { includedTags: tags, excludedTags: excludeTags }
              : undefined,
        });
      }

      case "run": {
        const scriptPath = resolve(contextPath, parts[1]);
        return new PageActionRunJavascript(scriptPath);
      }

      case "wait": {
        const ms = parseInt(parts[1], 10);
        return new PageActionWait(isNaN(ms) ? 1000 : ms);
      }

      case "inject":
        return new PageActionInjectJavascript(
          resolve(contextPath, parts[1]),
        );

      default:
        return null;
    }
  }

  private substituteVars(
    text: string,
    vars: Record<string, string>,
  ): string {
    return text.replace(/\$\{(\w+)\}/g, (_, name) => vars[name] ?? `\${${name}}`);
  }
}
