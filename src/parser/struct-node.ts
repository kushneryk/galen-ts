import { Place } from "../specs/place.js";

export class StructNode {
  childNodes: StructNode[] = [];

  constructor(
    public name: string,
    public place?: Place,
  ) {}

  hasChildNodes(): boolean {
    return this.childNodes.length > 0;
  }
}
