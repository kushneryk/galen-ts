export class Place {
  constructor(
    public readonly filePath: string,
    public readonly lineNumber: number,
  ) {}

  toPrettyString(): string {
    return `${this.filePath}:${this.lineNumber}`;
  }

  toString(): string {
    return this.toPrettyString();
  }
}
