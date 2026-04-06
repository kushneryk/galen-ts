import { Side } from "../specs/side.js";
import { Point } from "./point.js";

export class Rect {
  constructor(
    public readonly left: number,
    public readonly top: number,
    public readonly width: number,
    public readonly height: number,
  ) {}

  get right(): number {
    return this.left + this.width;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  contains(point: Point): boolean {
    return (
      point.left >= this.left &&
      point.left <= this.right &&
      point.top >= this.top &&
      point.top <= this.bottom
    );
  }

  getEdgePosition(side: Side): number {
    switch (side) {
      case Side.LEFT:
        return this.left;
      case Side.RIGHT:
        return this.right;
      case Side.TOP:
        return this.top;
      case Side.BOTTOM:
        return this.bottom;
    }
  }

  offset(offsetLeft: number, offsetTop: number): Rect {
    return new Rect(
      this.left + offsetLeft,
      this.top + offsetTop,
      this.width,
      this.height,
    );
  }

  static boundaryOf(...rects: Rect[]): Rect {
    if (rects.length === 0) {
      throw new Error("Cannot compute boundary of zero rectangles");
    }
    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    for (const r of rects) {
      minLeft = Math.min(minLeft, r.left);
      minTop = Math.min(minTop, r.top);
      maxRight = Math.max(maxRight, r.right);
      maxBottom = Math.max(maxBottom, r.bottom);
    }
    return new Rect(minLeft, minTop, maxRight - minLeft, maxBottom - minTop);
  }

  toArray(): [number, number, number, number] {
    return [this.left, this.top, this.width, this.height];
  }

  toString(): string {
    return `Rect{left=${this.left}, top=${this.top}, width=${this.width}, height=${this.height}}`;
  }
}
