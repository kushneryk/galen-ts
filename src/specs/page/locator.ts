export enum LocatorType {
  CSS = "css",
  XPATH = "xpath",
  ID = "id",
}

export enum CorrectionType {
  MINUS = "minus",
  PLUS = "plus",
  EQUALS = "equals",
}

export interface Correction {
  value: number;
  type: CorrectionType;
}

export interface CorrectionsRect {
  left?: Correction;
  top?: Correction;
  width?: Correction;
  height?: Correction;
}

export function applyCorrection(
  correction: Correction | undefined,
  original: number,
): number {
  if (!correction) return original;
  switch (correction.type) {
    case CorrectionType.PLUS:
      return original + correction.value;
    case CorrectionType.MINUS:
      return original - correction.value;
    case CorrectionType.EQUALS:
      return correction.value;
  }
}

export class Locator {
  constructor(
    public readonly locatorType: LocatorType,
    public readonly locatorValue: string,
    public readonly corrections?: CorrectionsRect,
    public readonly index: number = 0,
    public readonly parent?: Locator,
  ) {}

  static css(value: string): Locator {
    return new Locator(LocatorType.CSS, value);
  }

  static xpath(value: string): Locator {
    return new Locator(LocatorType.XPATH, value);
  }

  static id(value: string): Locator {
    return new Locator(LocatorType.ID, `#${value}`);
  }

  withCorrections(corrections: CorrectionsRect): Locator {
    return new Locator(
      this.locatorType,
      this.locatorValue,
      corrections,
      this.index,
      this.parent,
    );
  }

  withIndex(index: number): Locator {
    return new Locator(
      this.locatorType,
      this.locatorValue,
      this.corrections,
      index,
      this.parent,
    );
  }

  withParent(parent: Locator): Locator {
    return new Locator(
      this.locatorType,
      this.locatorValue,
      this.corrections,
      this.index,
      parent,
    );
  }

  prettyString(): string {
    const prefix = this.parent ? `${this.parent.prettyString()} / ` : "";
    const suffix = this.index > 0 ? `[${this.index}]` : "";
    return `${prefix}${this.locatorType}: ${this.locatorValue}${suffix}`;
  }

  toPlaywrightSelector(): string {
    switch (this.locatorType) {
      case LocatorType.CSS:
        return this.locatorValue;
      case LocatorType.XPATH:
        return `xpath=${this.locatorValue}`;
      case LocatorType.ID:
        return this.locatorValue;
    }
  }

  toString(): string {
    return this.prettyString();
  }
}
