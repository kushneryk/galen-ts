export class Point {
  constructor(
    public readonly left: number,
    public readonly top: number,
  ) {}

  toString(): string {
    return `Point{left=${this.left}, top=${this.top}}`;
  }
}
