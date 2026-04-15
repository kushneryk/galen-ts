import { Spec } from "../specs/spec.js";
import {
  SpecWidth,
  SpecHeight,
  SpecAbove,
  SpecBelow,
  SpecLeftOf,
  SpecRightOf,
  SpecInside,
  SpecNear,
  SpecOn,
  SpecCentered,
  SpecAligned,
  SpecHorizontally,
  SpecVertically,
  SpecText,
  SpecCss,
  SpecOcr,
  SpecImage,
  SpecColorScheme,
  SpecVisible,
  SpecAbsent,
  SpecCount,
  SpecContains,
  SpecComponent,
  Alignment,
  CenteredLocation,
  TextCheckType,
  CountFetchType,
  ErrorRateType,
} from "../specs/specs.js";
import { Range, RangeValue } from "../specs/range.js";
import { Side, parseSide } from "../specs/side.js";
import { StringCharReader } from "./string-char-reader.js";
import {
  expectRange,
  expectLocations,
  expectErrorRate,
  expectColorRanges,
  expectCommaSeparatedKeyValues,
} from "./expectations.js";

type SpecProcessor = (
  reader: StringCharReader,
  contextPath?: string,
) => Spec;

const specProcessors = new Map<string, SpecProcessor>();

// --- Width / Height ---

function specWithRange(
  factory: (range: Range) => Spec,
): SpecProcessor {
  return (reader) => {
    const range = expectRange(reader);
    const rest = reader.getTheRest().trim();
    if (rest) {
      throw new Error(`Unexpected token: '${rest}'`);
    }
    return factory(range);
  };
}

specProcessors.set("width", specWithRange((r) => new SpecWidth(r)));
specProcessors.set("height", specWithRange((r) => new SpecHeight(r)));

// --- Above / Below / Left-of / Right-of ---

function specWithObjectAndRange(
  factory: (obj: string, range: Range) => Spec,
): SpecProcessor {
  return (reader) => {
    const objectName = reader.readWord();
    if (!objectName) {
      throw new Error("Missing object name");
    }
    let range: Range;
    if (reader.hasMoreNormalSymbols()) {
      range = expectRange(reader);
    } else {
      range = Range.greaterThanOrEquals(new RangeValue(0));
    }
    return factory(objectName, range);
  };
}

specProcessors.set(
  "above",
  specWithObjectAndRange((o, r) => new SpecAbove(o, r)),
);
specProcessors.set(
  "below",
  specWithObjectAndRange((o, r) => new SpecBelow(o, r)),
);
specProcessors.set(
  "left-of",
  specWithObjectAndRange((o, r) => new SpecLeftOf(o, r)),
);
specProcessors.set(
  "right-of",
  specWithObjectAndRange((o, r) => new SpecRightOf(o, r)),
);

// --- Inside ---

specProcessors.set("inside", (reader) => {
  let partly = false;
  let firstWord = reader.readWord();
  if (!firstWord) {
    throw new Error("Missing object name");
  }

  if (firstWord === "partly") {
    partly = true;
    firstWord = reader.readWord();
    if (!firstWord) {
      throw new Error("Missing object name after 'partly'");
    }
  }

  const locations = expectLocations(reader);
  const spec = new SpecInside(firstWord, locations);
  if (partly) spec.withPartlyCheck();
  return spec;
});

// --- Near ---

specProcessors.set("near", (reader) => {
  const objectName = reader.readWord();
  if (!objectName) {
    throw new Error("Missing object name");
  }
  const locations = expectLocations(reader);
  if (locations.length === 0) {
    throw new Error("Missing location");
  }
  return new SpecNear(objectName, locations);
});

// --- On ---

specProcessors.set("on", (reader) => {
  // First word could be "edge" keyword or object name
  let firstWord = reader.readWord();
  if (!firstWord) {
    throw new Error("Missing object name");
  }

  let objectName: string;
  if (firstWord === "edge") {
    // "on edge objectName top left ..." — skip edge keyword
    objectName = reader.readWord();
    if (!objectName) {
      throw new Error("Missing object name after 'edge'");
    }
  } else {
    objectName = firstWord;
  }

  // Read sides
  const horizontalWord = reader.readWord();
  const verticalWord = reader.readWord();

  let sideHorizontal: Side;
  let sideVertical: Side;

  try {
    sideHorizontal = parseSide(horizontalWord);
    sideVertical = parseSide(verticalWord);
  } catch {
    throw new Error(
      `Expected side names (left/right/top/bottom) but got: '${horizontalWord}', '${verticalWord}'`,
    );
  }

  const locations = expectLocations(reader);
  return new SpecOn(objectName, sideHorizontal, sideVertical, locations);
});

// --- Contains ---

specProcessors.set("contains", (reader) => {
  let partly = false;
  const pos = reader.getCursorPosition();
  const firstWord = reader.readWord();

  if (firstWord === "partly") {
    partly = true;
  } else {
    reader.moveCursorTo(pos);
  }

  const rest = reader.takeTheRest().trim();
  const objectNames = rest
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (objectNames.length === 0) {
    throw new Error("Missing object name");
  }
  return new SpecContains(objectNames, partly);
});

// --- Aligned ---

specProcessors.set("aligned", (reader) => {
  const direction = reader.readWord();
  const isVertical = direction === "vertically";
  if (!isVertical && direction !== "horizontally") {
    throw new Error(
      `Expected 'vertically' or 'horizontally', got: '${direction}'`,
    );
  }

  const alignmentWord = reader.readWord();
  const alignment = parseAlignment(alignmentWord);

  const objectName = reader.readWord();
  if (!objectName) {
    throw new Error("Missing object name");
  }

  let errorRate = 0;
  if (reader.hasMoreNormalSymbols()) {
    errorRate = expectErrorRate(reader);
  }

  if (isVertical) {
    return new SpecVertically(objectName, alignment, errorRate);
  }
  return new SpecHorizontally(objectName, alignment, errorRate);
});

// --- Centered ---

specProcessors.set("centered", (reader) => {
  let alignment = Alignment.ALL;
  let location: CenteredLocation;

  const firstWord = reader.readWord();
  if (!firstWord) {
    throw new Error("Missing location and alignment");
  }

  if (firstWord === "on" || firstWord === "inside") {
    location = firstWord === "on" ? CenteredLocation.ON : CenteredLocation.INSIDE;
  } else {
    // Map direction keywords to alignment
    if (firstWord === "horizontally") {
      alignment = Alignment.HORIZONTALLY;
    } else if (firstWord === "vertically") {
      alignment = Alignment.VERTICALLY;
    } else if (firstWord === "all") {
      alignment = Alignment.ALL;
    } else {
      alignment = parseAlignment(firstWord);
    }
    const locationWord = reader.readWord();
    if (!locationWord) {
      throw new Error("Missing location (on, inside)");
    }
    location =
      locationWord === "on" ? CenteredLocation.ON : CenteredLocation.INSIDE;
  }

  const objectName = reader.readWord();
  if (!objectName) {
    throw new Error("Missing object name");
  }

  let errorRate = 2; // default
  if (reader.hasMoreNormalSymbols()) {
    errorRate = expectErrorRate(reader);
  }

  return new SpecCentered(objectName, alignment, location, errorRate);
});

// --- Text ---

specProcessors.set("text", (reader) => {
  return parseTextSpec(reader, (type, text, ops) => new SpecText(type, text, ops));
});

// --- CSS ---

specProcessors.set("css", (reader) => {
  const propertyName = reader.readWord();
  if (!propertyName) {
    throw new Error("Missing CSS property name");
  }
  return parseTextSpec(
    reader,
    (type, text, ops) => new SpecCss(propertyName, type, text, ops),
  );
});

// --- OCR ---

specProcessors.set("ocr", (reader) => {
  return parseTextSpec(reader, (type, text, ops) => new SpecOcr(type, text, ops));
});

function parseTextSpec(
  reader: StringCharReader,
  factory: (type: TextCheckType, text: string, operations: string[]) => Spec,
): Spec {
  const operations: string[] = [];
  let checkType: TextCheckType | null = null;

  while (checkType === null && reader.hasMoreNormalSymbols()) {
    const word = reader.readWord();
    if (!word) {
      throw new Error("Expected text check type, but got nothing");
    }
    const parsed = parseTextCheckType(word);
    if (parsed !== null) {
      checkType = parsed;
    } else {
      operations.push(word);
    }
  }

  if (checkType === null) {
    throw new Error("Missing text check type (is, contains, starts, ends, matches)");
  }

  const expectedText = reader.readDoubleQuotedText();

  const rest = reader.getTheRest().trim();
  if (rest) {
    throw new Error(`Too many arguments for spec: '${rest}'`);
  }

  return factory(checkType, expectedText, operations);
}

function parseTextCheckType(word: string): TextCheckType | null {
  switch (word.toLowerCase()) {
    case "is":
      return TextCheckType.IS;
    case "contains":
      return TextCheckType.CONTAINS;
    case "starts":
      return TextCheckType.STARTS;
    case "ends":
      return TextCheckType.ENDS;
    case "matches":
      return TextCheckType.MATCHES;
    default:
      return null;
  }
}

// --- Visible / Absent ---

specProcessors.set("visible", () => new SpecVisible());
specProcessors.set("absent", () => new SpecAbsent());

// --- Count ---

specProcessors.set("count", (reader) => {
  const fetchTypeWord = reader.readWord();
  const fetchType = parseCountFetchType(fetchTypeWord);

  let pattern: string;
  reader.skipWhitespace();
  if (reader.hasMore() && reader.currentSymbol() === '"') {
    pattern = reader.readDoubleQuotedText();
  } else {
    pattern = reader.readWord();
  }

  if (!pattern) {
    throw new Error("Pattern should not be empty");
  }

  // Expect "is"
  const isWord = reader.readWord();
  if (isWord !== "is") {
    throw new Error(`Expected 'is' but got: '${isWord}'`);
  }

  const range = expectRange(reader, { noEndingWord: true });
  return new SpecCount(fetchType, pattern, range);
});

function parseCountFetchType(word: string): CountFetchType {
  switch (word.toLowerCase()) {
    case "any":
      return CountFetchType.ANY;
    case "visible":
      return CountFetchType.VISIBLE;
    case "absent":
      return CountFetchType.ABSENT;
    default:
      throw new Error(`Unknown count fetch type: '${word}'`);
  }
}

// --- Color Scheme ---

specProcessors.set("color-scheme", (reader) => {
  const colorRanges = expectColorRanges(reader);
  if (colorRanges.length === 0) {
    throw new Error("There are no colors defined");
  }
  return new SpecColorScheme(
    colorRanges.map((cr) => ({
      range: cr.range,
      colorHex: cr.colorHex,
    })),
  );
});

// --- Image ---

specProcessors.set("image", (reader) => {
  const spec = new SpecImage();
  const params = expectCommaSeparatedKeyValues(reader);

  for (const [key, value] of params) {
    switch (key) {
      case "file":
        spec.imagePaths.push(unquote(value));
        break;
      case "error":
        spec.errorRate = parseImageErrorRate(unquote(value));
        break;
      case "tolerance":
        spec.tolerance = parseInt(value, 10);
        break;
      case "analyze-offset":
        spec.analyzeOffset = parseInt(value, 10);
        break;
      case "stretch":
        spec.stretch = true;
        break;
      case "crop-if-outside":
        spec.cropIfOutside = true;
        break;
      case "area":
        spec.selectedArea = parseArea(value);
        break;
      case "filter":
        spec.originalFilters.push(parseFilterWithParams(value));
        spec.sampleFilters.push(parseFilterWithParams(value));
        break;
      case "filter-a":
        spec.originalFilters.push(parseFilterWithParams(value));
        break;
      case "filter-b":
        spec.sampleFilters.push(parseFilterWithParams(value));
        break;
      case "map-filter":
        spec.mapFilters.push(parseFilterWithParams(value));
        break;
      case "ignore-objects":
        spec.ignoredObjectExpressions.push(
          ...value.split(",").map((s) => unquote(s.trim())),
        );
        break;
    }
  }

  return spec;
});

function parseImageErrorRate(text: string): {
  value: number;
  type: import("../specs/specs.js").ErrorRateType;
} {
  let t = text.toLowerCase().trim();
  if (t.startsWith("~")) {
    t = t.slice(1).trimStart();
  }
  if (t.endsWith("%")) {
    return {
      value: parseFloat(t.slice(0, -1)),
      type: ErrorRateType.PERCENT,
    };
  }
  if (t.endsWith("px")) {
    return {
      value: parseFloat(t.slice(0, -2)),
      type: ErrorRateType.PIXELS,
    };
  }
  // Named presets
  switch (t) {
    case "low":
      return { value: 1, type: ErrorRateType.PERCENT };
    case "medium":
      return { value: 3, type: ErrorRateType.PERCENT };
    case "high":
      return { value: 5, type: ErrorRateType.PERCENT };
    default:
      return { value: parseFloat(t), type: ErrorRateType.PIXELS };
  }
}

function parseFilterWithParams(text: string): import("../specs/specs.js").ImageFilter {
  const trimmed = text.trim();
  const parenStart = trimmed.indexOf("(");
  if (parenStart >= 0) {
    const parenEnd = trimmed.lastIndexOf(")");
    const name = trimmed.substring(0, parenStart).trim();
    const paramsStr = trimmed.substring(parenStart + 1, parenEnd > parenStart ? parenEnd : trimmed.length);
    const params = paramsStr.split(",").map((p) => {
      const t = p.trim();
      const n = Number(t);
      return isNaN(n) ? t : n;
    });
    return { name, params };
  }
  // Space-separated: "blur 2" or just "blur"
  const parts = trimmed.split(/\s+/);
  const name = parts[0];
  const params = parts.slice(1).map((p) => {
    const n = Number(p);
    return isNaN(n) ? p : n;
  });
  return { name, params };
}

function parseArea(
  text: string,
): { left: number; top: number; width: number; height: number } {
  const parts = text.trim().split(/\s+/).map(Number);
  if (parts.length !== 4) {
    throw new Error(`Invalid area: '${text}', expected 4 numbers`);
  }
  return {
    left: parts[0],
    top: parts[1],
    width: parts[2],
    height: parts[3],
  };
}

// --- Component ---

specProcessors.set("component", (reader, contextPath) => {
  let frame = false;
  const pos = reader.getCursorPosition();
  const firstWord = reader.readWord();

  if (firstWord === "frame") {
    frame = true;
  } else {
    reader.moveCursorTo(pos);
  }

  let filePath = reader.readSafeUntilSymbol(",").trim();
  if (!filePath) {
    filePath = reader.takeTheRest().trim();
  }

  // Parse arguments
  const args: Record<string, unknown> = {};
  if (reader.hasMoreNormalSymbols()) {
    const params = expectCommaSeparatedKeyValues(reader);
    for (const [key, value] of params) {
      args[key] = parseArgumentValue(value);
    }
  }

  if (contextPath && contextPath !== ".") {
    filePath = `${contextPath}/${filePath}`;
  }

  return new SpecComponent(filePath, frame, args);
});

function parseArgumentValue(value: string): unknown {
  if (value === "" || value === null || value === undefined) return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.?\d*$/.test(value)) return parseFloat(value);
  return unquote(value);
}

// --- Helpers ---

function parseAlignment(word: string): Alignment {
  switch (word.toLowerCase()) {
    case "centered":
      return Alignment.CENTERED;
    case "top":
      return Alignment.TOP;
    case "bottom":
      return Alignment.BOTTOM;
    case "left":
      return Alignment.LEFT;
    case "right":
      return Alignment.RIGHT;
    case "all":
      return Alignment.ALL;
    default:
      throw new Error(`Unknown alignment: '${word}'`);
  }
}

function unquote(text: string): string {
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
}

// --- Main entry point ---

export class SpecReader {
  read(specText: string, contextPath?: string): Spec {
    const trimmed = specText.trim();
    const reader = new StringCharReader(trimmed);
    const keyword = reader.readWord().toLowerCase();

    const processor = specProcessors.get(keyword);
    if (!processor) {
      throw new Error(`Unknown spec: '${keyword}'`);
    }

    const spec = processor(reader, contextPath);
    spec.originalText = trimmed;
    return spec;
  }
}
