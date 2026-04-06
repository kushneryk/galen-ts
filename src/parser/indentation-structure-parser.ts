import { Place } from "../specs/place.js";
import { StructNode } from "./struct-node.js";
import { SyntaxError } from "./syntax-error.js";

const COMMENT_SYMBOL = "#";
const TAB_SIZE = 4;

interface IndentationNode {
  node: StructNode;
  indentation: number;
  childIndentation: number | null;
}

export class IndentationStructureParser {
  parse(text: string, source: string = "<unknown>"): StructNode[] {
    const lines = text.split("\n");
    const rootChildren: StructNode[] = [];
    const stack: IndentationNode[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      if (this.isBlankOrComment(line)) continue;

      const indentation = this.calculateIndentation(line);
      const trimmedLine = line.trim();
      const place = new Place(source, lineNumber);
      const node = new StructNode(trimmedLine, place);

      // Pop stack until we find the right parent
      while (
        stack.length > 0 &&
        indentation <= stack[stack.length - 1].indentation
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Root-level node
        rootChildren.push(node);
        stack.push({ node, indentation, childIndentation: null });
      } else {
        const parent = stack[stack.length - 1];

        // Validate consistent child indentation
        if (parent.childIndentation === null) {
          parent.childIndentation = indentation;
        } else if (parent.childIndentation !== indentation) {
          throw new SyntaxError(
            place,
            `Inconsistent indentation: expected ${parent.childIndentation} spaces but got ${indentation}`,
          );
        }

        parent.node.childNodes.push(node);
        stack.push({ node, indentation, childIndentation: null });
      }
    }

    return rootChildren;
  }

  private isBlankOrComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === "" || trimmed.startsWith(COMMENT_SYMBOL);
  }

  private calculateIndentation(line: string): number {
    let indentation = 0;
    for (const ch of line) {
      if (ch === " ") {
        indentation++;
      } else if (ch === "\t") {
        indentation += TAB_SIZE;
      } else {
        break;
      }
    }
    return indentation;
  }
}
