import { Range } from "../specs/range.js";
import { Side } from "../specs/side.js";
import { Rect } from "../page/rect.js";
import type { LayoutMeta } from "./validation-result.js";
import type { PageValidation } from "./page-validation.js";

export interface SimpleValidationResult {
  error?: string;
  meta: LayoutMeta;
}

export class MetaBasedValidation {
  private firstEdge: Side = Side.LEFT;
  private secondEdge: Side = Side.LEFT;
  private inverted = false;

  constructor(
    private readonly firstName: string,
    private readonly secondName: string,
    private readonly expectedRange: Range,
  ) {}

  static forObjects(
    firstName: string,
    secondName: string,
    range: Range,
  ): MetaBasedValidation {
    return new MetaBasedValidation(firstName, secondName, range);
  }

  withFirstEdge(edge: Side): this {
    this.firstEdge = edge;
    return this;
  }

  withSecondEdge(edge: Side): this {
    this.secondEdge = edge;
    return this;
  }

  withBothEdges(edge: Side): this {
    this.firstEdge = edge;
    this.secondEdge = edge;
    return this;
  }

  withInvertedCalculation(inverted: boolean): this {
    this.inverted = inverted;
    return this;
  }

  async validate(
    firstArea: Rect,
    secondArea: Rect,
    pageValidation: PageValidation,
    direction: string,
  ): Promise<SimpleValidationResult> {
    const offset = this.getOffset(firstArea, secondArea);
    const calculatedOffset = await pageValidation.convertValue(
      this.expectedRange,
      offset,
    );

    const meta: LayoutMeta = {
      key: `${this.firstName}/${direction}`,
      value: `${offset}px`,
    };

    if (!this.expectedRange.holds(calculatedOffset)) {
      return {
        error: `${offset}px ${direction}`,
        meta,
      };
    }

    return { meta };
  }

  private getOffset(firstArea: Rect, secondArea: Rect): number {
    const offset =
      firstArea.getEdgePosition(this.firstEdge) -
      secondArea.getEdgePosition(this.secondEdge);
    return this.inverted ? -offset : offset;
  }
}
