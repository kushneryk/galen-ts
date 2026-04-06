import { Location } from "./location.js";
import { Range } from "./range.js";
import { Side } from "./side.js";
import { Spec } from "./spec.js";

// --- Size specs ---

export class SpecWidth extends Spec {
  constructor(public readonly range: Range) {
    super();
  }
}

export class SpecHeight extends Spec {
  constructor(public readonly range: Range) {
    super();
  }
}

// --- Direction/Position specs ---

export abstract class SpecDirectionPosition extends Spec {
  constructor(
    public readonly object: string,
    public readonly range: Range,
  ) {
    super();
  }
}

export class SpecAbove extends SpecDirectionPosition {}
export class SpecBelow extends SpecDirectionPosition {}
export class SpecLeftOf extends SpecDirectionPosition {}
export class SpecRightOf extends SpecDirectionPosition {}

// --- Complex specs (object + locations) ---

export abstract class SpecComplex extends Spec {
  constructor(
    public readonly object: string,
    public readonly locations: Location[],
  ) {
    super();
  }
}

export class SpecInside extends SpecComplex {
  partly: boolean = false;

  withPartlyCheck(): this {
    this.partly = true;
    return this;
  }
}

export class SpecNear extends SpecComplex {}

export class SpecOn extends SpecComplex {
  constructor(
    object: string,
    public readonly sideHorizontal: Side,
    public readonly sideVertical: Side,
    locations: Location[],
  ) {
    super(object, locations);
  }
}

// --- Alignment specs ---

export enum Alignment {
  CENTERED = "centered",
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
  ALL = "all",
  HORIZONTALLY = "horizontally",
  VERTICALLY = "vertically",
}

export abstract class SpecObjectWithErrorRate extends Spec {
  constructor(
    public readonly object: string,
    public readonly errorRate: number = 0,
  ) {
    super();
  }
}

export enum CenteredLocation {
  ON = "on",
  INSIDE = "inside",
}

export class SpecCentered extends SpecObjectWithErrorRate {
  constructor(
    object: string,
    public readonly alignment: Alignment,
    public readonly location: CenteredLocation,
    errorRate: number = 0,
  ) {
    super(object, errorRate);
  }
}

export class SpecAligned extends SpecObjectWithErrorRate {
  constructor(
    object: string,
    public readonly alignment: Alignment,
    errorRate: number = 0,
  ) {
    super(object, errorRate);
  }
}

export class SpecHorizontally extends SpecObjectWithErrorRate {
  constructor(
    object: string,
    public readonly alignment: Alignment,
    errorRate: number = 0,
  ) {
    super(object, errorRate);
  }
}

export class SpecVertically extends SpecObjectWithErrorRate {
  constructor(
    object: string,
    public readonly alignment: Alignment,
    errorRate: number = 0,
  ) {
    super(object, errorRate);
  }
}

// --- Content specs ---

export enum TextCheckType {
  IS = "is",
  CONTAINS = "contains",
  STARTS = "starts",
  ENDS = "ends",
  MATCHES = "matches",
}

export class SpecText extends Spec {
  constructor(
    public readonly type: TextCheckType,
    public readonly text: string,
    public readonly operations: string[] = [],
  ) {
    super();
  }
}

export class SpecCss extends Spec {
  constructor(
    public readonly cssPropertyName: string,
    public readonly type: TextCheckType,
    public readonly text: string,
    public readonly operations: string[] = [],
  ) {
    super();
  }
}

export class SpecOcr extends Spec {
  constructor(
    public readonly type: TextCheckType,
    public readonly text: string,
    public readonly operations: string[] = [],
  ) {
    super();
  }
}

// --- Visual specs ---

export enum ErrorRateType {
  PIXELS = "pixels",
  PERCENT = "percent",
}

export interface ImageErrorRate {
  value: number;
  type: ErrorRateType;
}

export interface ImageFilter {
  name: string;
  params: unknown[];
}

export class SpecImage extends Spec {
  imagePaths: string[] = [];
  errorRate?: ImageErrorRate;
  tolerance?: number;
  originalFilters: ImageFilter[] = [];
  sampleFilters: ImageFilter[] = [];
  mapFilters: ImageFilter[] = [];
  selectedArea?: { left: number; top: number; width: number; height: number };
  stretch: boolean = false;
  cropIfOutside: boolean = false;
  analyzeOffset: number = 0;
  ignoredObjectExpressions: string[] = [];
}

export interface ColorRange {
  range: Range;
  colorHex: string;
}

export class SpecColorScheme extends Spec {
  constructor(public readonly colorRanges: ColorRange[]) {
    super();
  }
}

// --- State specs ---

export class SpecVisible extends Spec {}
export class SpecAbsent extends Spec {}

// --- Count spec ---

export enum CountFetchType {
  ANY = "any",
  VISIBLE = "visible",
  ABSENT = "absent",
}

export class SpecCount extends Spec {
  constructor(
    public readonly fetchType: CountFetchType,
    public readonly pattern: string,
    public readonly amount: Range,
  ) {
    super();
  }
}

// --- Container spec ---

export class SpecContains extends Spec {
  constructor(
    public readonly childObjects: string[],
    public readonly partly: boolean = false,
  ) {
    super();
  }
}

// --- Component spec ---

export class SpecComponent extends Spec {
  constructor(
    public readonly specPath: string,
    public readonly frame: boolean = false,
    public readonly args: Record<string, unknown> = {},
  ) {
    super();
  }
}
