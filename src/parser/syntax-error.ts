import { Place } from "../specs/place.js";

export class SyntaxError extends Error {
  constructor(
    public readonly place: Place | undefined,
    message: string,
  ) {
    super(place ? `${place.toPrettyString()}: ${message}` : message);
    this.name = "SyntaxError";
  }
}
