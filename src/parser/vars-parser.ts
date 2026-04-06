export type VarsContext = Record<string, unknown>;

export class VarsParser {
  readonly context: VarsContext;

  constructor(
    context: VarsContext = {},
    private readonly properties: Record<string, string> = {},
  ) {
    this.context = context;
  }

  parse(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      // Escape handling
      if (ch === "\\" && i + 1 < text.length && text[i + 1] === "$") {
        result += "$";
        i += 2;
        continue;
      }

      // Variable substitution
      if (ch === "$" && i + 1 < text.length && text[i + 1] === "{") {
        i += 2; // skip ${
        let expression = "";
        let depth = 1;
        while (i < text.length && depth > 0) {
          if (text[i] === "{") depth++;
          else if (text[i] === "}") {
            depth--;
            if (depth === 0) break;
          }
          expression += text[i];
          i++;
        }
        i++; // skip closing }

        result += this.resolveExpression(expression);
        continue;
      }

      result += ch;
      i++;
    }

    return result;
  }

  private resolveExpression(expression: string): string {
    // Check context first
    if (expression in this.context) {
      const val = this.context[expression];
      return val !== null && val !== undefined ? String(val) : "";
    }

    // Check properties
    if (expression in this.properties) {
      return this.properties[expression];
    }

    // Try as JavaScript expression
    try {
      const fn = new Function(
        ...Object.keys(this.context),
        `return (${expression});`,
      );
      const result = fn(...Object.values(this.context));
      return result !== null && result !== undefined ? String(result) : "";
    } catch {
      return "";
    }
  }

  setVariable(name: string, value: unknown): void {
    this.context[name] = value;
  }

  getVariable(name: string): unknown {
    return this.context[name];
  }
}
