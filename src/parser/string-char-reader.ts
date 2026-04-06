export class StringCharReader {
  private cursor = 0;

  constructor(private readonly text: string) {}

  get length(): number {
    return this.text.length;
  }

  hasMore(): boolean {
    return this.cursor < this.text.length;
  }

  next(): string {
    if (!this.hasMore()) {
      throw new Error("Reached end of text");
    }
    return this.text[this.cursor++];
  }

  back(): void {
    if (this.cursor > 0) {
      this.cursor--;
    }
  }

  currentSymbol(): string {
    if (this.cursor >= this.text.length) {
      return this.text[this.text.length - 1] ?? "";
    }
    return this.text[this.cursor];
  }

  firstNonWhiteSpaceSymbol(): string {
    for (let i = this.cursor; i < this.text.length; i++) {
      const ch = this.text[i];
      if (ch !== " " && ch !== "\t") {
        return ch;
      }
    }
    return "";
  }

  hasMoreNormalSymbols(): boolean {
    return this.firstNonWhiteSpaceSymbol() !== "";
  }

  readWord(): string {
    this.skipDelimiters();
    let word = "";
    while (this.hasMore()) {
      const ch = this.next();
      if (ch === " " || ch === "\t" || ch === ",") {
        this.back();
        break;
      }
      word += ch;
    }
    return word;
  }

  readUntilSymbol(symbol: string): string {
    let result = "";
    while (this.hasMore()) {
      const ch = this.next();
      if (ch === symbol) {
        return result;
      }
      result += ch;
    }
    throw new Error(`Could not find symbol '${symbol}' in: ${this.text}`);
  }

  readSafeUntilSymbol(symbol: string): string {
    let result = "";
    while (this.hasMore()) {
      const ch = this.next();
      if (ch === symbol) {
        return result;
      }
      result += ch;
    }
    return result;
  }

  getTheRest(): string {
    return this.text.substring(this.cursor);
  }

  takeTheRest(): string {
    const rest = this.text.substring(this.cursor);
    this.cursor = this.text.length;
    return rest;
  }

  readDoubleQuotedText(): string {
    this.skipDelimiters();
    const ch = this.next();
    if (ch !== '"') {
      throw new Error(`Expected '\"' but got '${ch}'`);
    }
    let result = "";
    while (this.hasMore()) {
      const c = this.next();
      if (c === "\\") {
        if (this.hasMore()) {
          const escaped = this.next();
          if (escaped === '"') result += '"';
          else if (escaped === "\\") result += "\\";
          else if (escaped === "n") result += "\n";
          else if (escaped === "t") result += "\t";
          else result += "\\" + escaped;
        }
      } else if (c === '"') {
        return result;
      } else {
        result += c;
      }
    }
    throw new Error("Missing closing double quote");
  }

  getCursorPosition(): number {
    return this.cursor;
  }

  moveCursorTo(position: number): void {
    this.cursor = position;
  }

  private skipDelimiters(): void {
    while (this.hasMore()) {
      const ch = this.text[this.cursor];
      if (ch === " " || ch === "\t") {
        this.cursor++;
      } else {
        break;
      }
    }
  }
}
