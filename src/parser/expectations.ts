import { Range, RangeType, RangeValue } from "../specs/range.js";
import { Location } from "../specs/location.js";
import { Side, parseSide } from "../specs/side.js";
import { StringCharReader } from "./string-char-reader.js";

// --- Range parsing ---

export interface RangeOptions {
  noEndingWord?: boolean;
}

function readRangeType(reader: StringCharReader): RangeType | null {
  reader.skipWhitespace();
  if (!reader.hasMore()) return null;

  const ch = reader.firstNonWhiteSpaceSymbol();

  if (ch === "~") {
    reader.skipToFirstNonWhitespace();
    reader.next(); // consume ~
    return RangeType.BETWEEN; // approximate — handled specially
  }
  if (ch === ">") {
    reader.skipToFirstNonWhitespace();
    reader.next();
    if (reader.hasMore() && reader.currentSymbol() === "=") {
      reader.next();
      return RangeType.GREATER_THAN_OR_EQUALS;
    }
    return RangeType.GREATER_THAN;
  }
  if (ch === "<") {
    reader.skipToFirstNonWhitespace();
    reader.next();
    if (reader.hasMore() && reader.currentSymbol() === "=") {
      reader.next();
      return RangeType.LESS_THAN_OR_EQUALS;
    }
    return RangeType.LESS_THAN;
  }
  return null;
}

function readNumber(reader: StringCharReader): number {
  reader.skipWhitespace();
  let text = "";
  let hasDot = false;

  while (reader.hasMore()) {
    const ch = reader.currentSymbol();
    if ((ch >= "0" && ch <= "9") || ch === "-") {
      text += reader.next();
    } else if (ch === ".") {
      if (hasDot) break;
      hasDot = true;
      text += reader.next();
    } else {
      break;
    }
  }

  if (text === "" || text === "-" || text === ".") {
    throw new Error("Expected a number");
  }
  return parseFloat(text);
}

function readRangeValue(reader: StringCharReader): RangeValue {
  reader.skipWhitespace();
  let text = "";
  let hasDot = false;

  while (reader.hasMore()) {
    const ch = reader.currentSymbol();
    if ((ch >= "0" && ch <= "9") || ch === "-") {
      text += reader.next();
    } else if (ch === ".") {
      if (hasDot) break;
      hasDot = true;
      text += reader.next();
    } else {
      break;
    }
  }

  return RangeValue.parse(text);
}

function readWordSkippingDelimiters(reader: StringCharReader): string {
  reader.skipWhitespace();
  let word = "";
  while (reader.hasMore()) {
    const ch = reader.currentSymbol();
    if (ch === " " || ch === "\t" || ch === ",") break;
    word += reader.next();
  }
  return word;
}

const APPROXIMATE_DELTA = 2;

export function expectRange(
  reader: StringCharReader,
  options: RangeOptions = {},
): Range {
  const isApproximate =
    reader.firstNonWhiteSpaceSymbol() === "~";
  const rangeTypeOverride = readRangeType(reader);

  const firstValue = readRangeValue(reader);

  const nonNumeric = readWordSkippingDelimiters(reader);

  if (isApproximate && rangeTypeOverride === RangeType.BETWEEN) {
    // Approximate range: ~100px means 98-102
    if (nonNumeric === "px" || nonNumeric === "" || options.noEndingWord) {
      return Range.between(
        new RangeValue(firstValue.asDouble() - APPROXIMATE_DELTA),
        new RangeValue(firstValue.asDouble() + APPROXIMATE_DELTA),
      );
    }
  }

  if (nonNumeric === "px" || (options.noEndingWord && nonNumeric === "")) {
    if (rangeTypeOverride === null) {
      return Range.exact(firstValue);
    }
    return createRangeWithType(rangeTypeOverride, firstValue);
  }

  if (nonNumeric === "%") {
    const ofWord = readWordSkippingDelimiters(reader);
    if (ofWord !== "of") {
      throw new Error(`Expected 'of' keyword but got: '${ofWord}'`);
    }
    const objectPath = readWordSkippingDelimiters(reader);
    const range =
      rangeTypeOverride === null
        ? Range.exact(firstValue)
        : createRangeWithType(rangeTypeOverride, firstValue);
    return range.withPercentageOf(objectPath);
  }

  if (nonNumeric === "to") {
    if (rangeTypeOverride !== null) {
      throw new Error("Cannot use range operator with 'to'");
    }
    const secondValue = readRangeValue(reader);
    const endWord = readWordSkippingDelimiters(reader);
    if (endWord === "%") {
      const ofWord = readWordSkippingDelimiters(reader);
      if (ofWord !== "of") {
        throw new Error(`Expected 'of' keyword but got: '${ofWord}'`);
      }
      const objectPath = readWordSkippingDelimiters(reader);
      return Range.between(firstValue, secondValue).withPercentageOf(
        objectPath,
      );
    }
    if (!options.noEndingWord && endWord !== "px") {
      throw new Error(`Expected 'px' but got: '${endWord}'`);
    }
    return Range.between(firstValue, secondValue);
  }

  if (options.noEndingWord && nonNumeric === "") {
    if (rangeTypeOverride === null) {
      return Range.exact(firstValue);
    }
    return createRangeWithType(rangeTypeOverride, firstValue);
  }

  throw new Error(`Unexpected token: '${nonNumeric}'`);
}

function createRangeWithType(type: RangeType, value: RangeValue): Range {
  switch (type) {
    case RangeType.GREATER_THAN:
      return Range.greaterThan(value);
    case RangeType.LESS_THAN:
      return Range.lessThan(value);
    case RangeType.GREATER_THAN_OR_EQUALS:
      return Range.greaterThanOrEquals(value);
    case RangeType.LESS_THAN_OR_EQUALS:
      return Range.lessThanOrEquals(value);
    default:
      return Range.exact(value);
  }
}

// --- Location parsing ---

export function expectLocations(reader: StringCharReader): Location[] {
  const locations: Location[] = [];

  while (reader.hasMoreNormalSymbols()) {
    const range = expectRange(reader);
    const sides = expectSides(reader);
    locations.push(new Location(range, sides));

    // Skip comma if present
    reader.skipWhitespace();
    if (reader.hasMore() && reader.currentSymbol() === ",") {
      reader.next();
    }
  }

  return locations;
}

function expectSides(reader: StringCharReader): Side[] {
  const sides: Side[] = [];

  while (reader.hasMoreNormalSymbols()) {
    const pos = reader.getCursorPosition();
    const word = reader.readWord();
    if (word === "") break;

    // Check if this looks like a side
    try {
      sides.push(parseSide(word));
    } catch {
      // Not a side — put it back
      reader.moveCursorTo(pos);
      break;
    }

    // Check for comma (next location)
    reader.skipWhitespace();
    if (reader.hasMore() && reader.currentSymbol() === ",") {
      break;
    }
  }

  return sides;
}

// --- Error rate parsing ---

export function expectErrorRate(reader: StringCharReader): number {
  const pos = reader.getCursorPosition();
  const value = readNumber(reader);
  const unit = readWordSkippingDelimiters(reader);
  if (unit !== "px") {
    reader.moveCursorTo(pos);
    throw new Error(`Expected 'px' after error rate, but got: '${unit}'`);
  }
  return value;
}

// --- Color range parsing ---

export interface ParsedColorRange {
  range: Range;
  colorHex: string;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  gray: "#808080",
  red: "#ff0000",
  orange: "#ffa500",
  pink: "#ffc0cb",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  magenta: "#ff00ff",
  cyan: "#00ffff",
};

function parseColor(text: string): string {
  if (text.startsWith("#")) {
    if (text.length === 4) {
      // #RGB → #RRGGBB
      return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
    }
    return text;
  }
  const hex = NAMED_COLORS[text.toLowerCase()];
  if (hex) return hex;
  throw new Error(`Unknown color: '${text}'`);
}

export function expectColorRanges(reader: StringCharReader): ParsedColorRange[] {
  const ranges: ParsedColorRange[] = [];

  while (reader.hasMoreNormalSymbols()) {
    const range = expectRange(reader, { noEndingWord: true });
    // After %, should read a color
    const colorText = reader.readWord();
    if (!colorText) {
      throw new Error("Expected color value");
    }
    const colorHex = parseColor(colorText);
    ranges.push({ range: range.withPercentageOf(""), colorHex });

    // Skip comma
    reader.skipWhitespace();
    if (reader.hasMore() && reader.currentSymbol() === ",") {
      reader.next();
    }
  }

  return ranges;
}

// --- Comma-separated key-value parsing ---

export function expectCommaSeparatedKeyValues(
  reader: StringCharReader,
): Map<string, string> {
  const result = new Map<string, string>();

  while (reader.hasMoreNormalSymbols()) {
    const key = reader.readWord();
    if (!key) break;

    reader.skipWhitespace();
    const value = readParamValue(reader);
    result.set(key, value.trim());
  }

  return result;
}

function readParamValue(reader: StringCharReader): string {
  const brackets: string[] = [];
  let text = "";

  while (reader.hasMore()) {
    const ch = reader.next();

    if (brackets.length === 0 && ch === ",") {
      return text;
    }

    if (ch === '"') {
      reader.back();
      text += reader.readDoubleQuotedText();
      continue;
    }

    if (ch === "[" || ch === "(" || ch === "{") {
      brackets.push(ch);
      text += ch;
    } else if (ch === "]" || ch === ")" || ch === "}") {
      const expected =
        ch === "]" ? "[" : ch === ")" ? "(" : "{";
      if (brackets.length > 0 && brackets[brackets.length - 1] === expected) {
        brackets.pop();
      }
      text += ch;
    } else {
      text += ch;
    }
  }

  return text;
}

// Convenience: add skipWhitespace to StringCharReader
declare module "./string-char-reader.js" {
  interface StringCharReader {
    skipWhitespace(): void;
    skipToFirstNonWhitespace(): void;
  }
}

StringCharReader.prototype.skipWhitespace = function () {
  while (this.hasMore()) {
    const ch = this.currentSymbol();
    if (ch === " " || ch === "\t") {
      this.next();
    } else {
      break;
    }
  }
};

StringCharReader.prototype.skipToFirstNonWhitespace =
  StringCharReader.prototype.skipWhitespace;
