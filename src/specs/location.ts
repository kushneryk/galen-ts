import { Range } from "./range.js";
import { Side } from "./side.js";

export class Location {
  constructor(
    public readonly range: Range,
    public readonly sides: Side[],
  ) {}

  static locations(...locations: Location[]): Location[] {
    return locations;
  }

  toString(): string {
    return `${this.range.prettyString()} ${this.sides.join(", ")}`;
  }
}
