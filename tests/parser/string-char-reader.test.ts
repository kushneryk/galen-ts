import { describe, it, expect } from "vitest";
import { StringCharReader } from "../../src/parser/string-char-reader.js";
import "../../src/parser/expectations.js"; // loads skipWhitespace extension

describe("StringCharReader", () => {
  describe("next / back / hasMore", () => {
    it("reads characters sequentially", () => {
      const r = new StringCharReader("abc");
      expect(r.next()).toBe("a");
      expect(r.next()).toBe("b");
      expect(r.next()).toBe("c");
    });

    it("back moves cursor one position back", () => {
      const r = new StringCharReader("abc");
      r.next();
      r.next();
      r.back();
      expect(r.next()).toBe("b");
    });

    it("hasMore returns false at end", () => {
      const r = new StringCharReader("a");
      r.next();
      expect(r.hasMore()).toBe(false);
    });

    it("next throws at end of text", () => {
      const r = new StringCharReader("a");
      r.next();
      expect(() => r.next()).toThrow();
    });

    it("back does nothing at position 0", () => {
      const r = new StringCharReader("a");
      r.back();
      expect(r.next()).toBe("a");
    });
  });

  describe("currentSymbol", () => {
    it("returns current character", () => {
      const r = new StringCharReader("abc");
      r.next();
      expect(r.currentSymbol()).toBe("b");
    });

    it("returns last char when cursor is at end", () => {
      const r = new StringCharReader("ab");
      r.next(); r.next();
      expect(r.currentSymbol()).toBe("b");
    });

    it("returns empty for empty string", () => {
      expect(new StringCharReader("").currentSymbol()).toBe("");
    });
  });

  describe("readWord", () => {
    it("reads until space", () => {
      expect(new StringCharReader("hello world").readWord()).toBe("hello");
    });

    it("reads until tab", () => {
      expect(new StringCharReader("ab\tcd").readWord()).toBe("ab");
    });

    it("reads until comma", () => {
      expect(new StringCharReader("ab,cd").readWord()).toBe("ab");
    });

    it("skips leading whitespace", () => {
      expect(new StringCharReader("  hello").readWord()).toBe("hello");
    });

    it("returns empty at end of text", () => {
      const r = new StringCharReader("a");
      r.next();
      expect(r.readWord()).toBe("");
    });
  });

  describe("readUntilSymbol", () => {
    it("reads up to target symbol", () => {
      expect(new StringCharReader("hello)world").readUntilSymbol(")")).toBe("hello");
    });

    it("throws when symbol not found", () => {
      expect(() => new StringCharReader("hello").readUntilSymbol(")")).toThrow();
    });
  });

  describe("readSafeUntilSymbol", () => {
    it("reads up to target symbol", () => {
      expect(new StringCharReader("a,b").readSafeUntilSymbol(",")).toBe("a");
    });

    it("returns rest of text when symbol not found", () => {
      expect(new StringCharReader("abc").readSafeUntilSymbol(",")).toBe("abc");
    });
  });

  describe("readDoubleQuotedText", () => {
    it("reads simple quoted string", () => {
      expect(new StringCharReader('"hello"').readDoubleQuotedText()).toBe("hello");
    });

    it('handles escaped quote \\"', () => {
      expect(new StringCharReader('"say \\"hi\\""').readDoubleQuotedText()).toBe('say "hi"');
    });

    it("handles escaped backslash \\\\", () => {
      expect(new StringCharReader('"a\\\\b"').readDoubleQuotedText()).toBe("a\\b");
    });

    it("handles \\n escape", () => {
      expect(new StringCharReader('"a\\nb"').readDoubleQuotedText()).toBe("a\nb");
    });

    it("handles \\t escape", () => {
      expect(new StringCharReader('"a\\tb"').readDoubleQuotedText()).toBe("a\tb");
    });

    it("handles unknown escape as literal", () => {
      expect(new StringCharReader('"a\\xb"').readDoubleQuotedText()).toBe("a\\xb");
    });

    it("throws for missing closing quote", () => {
      expect(() => new StringCharReader('"hello').readDoubleQuotedText()).toThrow();
    });

    it("throws when first char is not quote", () => {
      expect(() => new StringCharReader("hello").readDoubleQuotedText()).toThrow();
    });

    it("skips leading whitespace before quote", () => {
      expect(new StringCharReader('  "hello"').readDoubleQuotedText()).toBe("hello");
    });
  });

  describe("getTheRest vs takeTheRest", () => {
    it("getTheRest does not advance cursor", () => {
      const r = new StringCharReader("abcdef");
      r.next(); r.next();
      expect(r.getTheRest()).toBe("cdef");
      expect(r.getTheRest()).toBe("cdef"); // same result
    });

    it("takeTheRest advances cursor to end", () => {
      const r = new StringCharReader("abcdef");
      r.next(); r.next();
      expect(r.takeTheRest()).toBe("cdef");
      expect(r.hasMore()).toBe(false);
    });
  });

  describe("cursor save/restore", () => {
    it("getCursorPosition returns current position", () => {
      const r = new StringCharReader("abc");
      r.next();
      expect(r.getCursorPosition()).toBe(1);
    });

    it("moveCursorTo restores position", () => {
      const r = new StringCharReader("abc");
      r.next(); r.next();
      r.moveCursorTo(0);
      expect(r.next()).toBe("a");
    });
  });

  describe("firstNonWhiteSpaceSymbol", () => {
    it("skips spaces and tabs", () => {
      const r = new StringCharReader("  \t x");
      expect(r.firstNonWhiteSpaceSymbol()).toBe("x");
    });

    it("returns empty when only whitespace remains", () => {
      expect(new StringCharReader("   ").firstNonWhiteSpaceSymbol()).toBe("");
    });
  });

  describe("hasMoreNormalSymbols", () => {
    it("returns true when non-whitespace symbols remain", () => {
      expect(new StringCharReader("  x").hasMoreNormalSymbols()).toBe(true);
    });

    it("returns false when only whitespace remains", () => {
      expect(new StringCharReader("   ").hasMoreNormalSymbols()).toBe(false);
    });
  });
});
