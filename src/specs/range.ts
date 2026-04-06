export enum RangeType {
  BETWEEN = "between",
  EXACT = "exact",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  GREATER_THAN_OR_EQUALS = "greater_than_or_equals",
  LESS_THAN_OR_EQUALS = "less_than_or_equals",
}

export class RangeValue {
  constructor(
    private readonly value: number,
    public readonly precision: number = 0,
  ) {}

  asInt(): number {
    return Math.round(this.value);
  }

  asDouble(): number {
    return this.value;
  }

  isLessThan(other: RangeValue): boolean {
    return this.value < other.value;
  }

  isGreaterThan(other: RangeValue): boolean {
    return this.value > other.value;
  }

  isGreaterThanOrEquals(other: RangeValue): boolean {
    return this.value >= other.value;
  }

  isLessThanOrEquals(other: RangeValue): boolean {
    return this.value <= other.value;
  }

  isEquals(other: RangeValue): boolean {
    return this.value === other.value;
  }

  toString(): string {
    if (this.precision > 0) {
      return this.value.toFixed(this.precision);
    }
    return String(this.value);
  }

  static parse(text: string): RangeValue {
    const dotIndex = text.indexOf(".");
    if (dotIndex >= 0) {
      const precision = text.length - dotIndex - 1;
      return new RangeValue(parseFloat(text), precision);
    }
    return new RangeValue(parseInt(text, 10), 0);
  }
}

export class Range {
  private constructor(
    public readonly from: RangeValue | null,
    public readonly to: RangeValue | null,
    public readonly rangeType: RangeType,
    public readonly percentageOfValue?: string,
  ) {}

  holds(value: number): boolean {
    const v = new RangeValue(value);
    switch (this.rangeType) {
      case RangeType.EXACT:
        return this.from!.isEquals(v);
      case RangeType.BETWEEN:
        return this.from!.isLessThanOrEquals(v) && this.to!.isGreaterThanOrEquals(v);
      case RangeType.GREATER_THAN:
        return v.isGreaterThan(this.from!);
      case RangeType.LESS_THAN:
        return v.isLessThan(this.from!);
      case RangeType.GREATER_THAN_OR_EQUALS:
        return v.isGreaterThanOrEquals(this.from!);
      case RangeType.LESS_THAN_OR_EQUALS:
        return v.isLessThanOrEquals(this.from!);
    }
  }

  isPercentage(): boolean {
    return this.percentageOfValue !== undefined;
  }

  prettyString(units: string = "px"): string {
    const suffix = this.percentageOfValue
      ? `% of ${this.percentageOfValue}`
      : units;

    switch (this.rangeType) {
      case RangeType.EXACT:
        return `${this.from}${suffix}`;
      case RangeType.BETWEEN:
        return `${this.from} to ${this.to}${suffix}`;
      case RangeType.GREATER_THAN:
        return `> ${this.from}${suffix}`;
      case RangeType.LESS_THAN:
        return `< ${this.from}${suffix}`;
      case RangeType.GREATER_THAN_OR_EQUALS:
        return `>= ${this.from}${suffix}`;
      case RangeType.LESS_THAN_OR_EQUALS:
        return `<= ${this.from}${suffix}`;
    }
  }

  getErrorMessageSuffix(units: string = "px"): string {
    if (this.percentageOfValue) {
      return `% of ${this.percentageOfValue}/${units}`;
    }
    return units;
  }

  static exact(value: RangeValue): Range {
    return new Range(value, null, RangeType.EXACT);
  }

  static between(from: RangeValue, to: RangeValue): Range {
    return new Range(from, to, RangeType.BETWEEN);
  }

  static greaterThan(value: RangeValue): Range {
    return new Range(value, null, RangeType.GREATER_THAN);
  }

  static lessThan(value: RangeValue): Range {
    return new Range(value, null, RangeType.LESS_THAN);
  }

  static greaterThanOrEquals(value: RangeValue): Range {
    return new Range(value, null, RangeType.GREATER_THAN_OR_EQUALS);
  }

  static lessThanOrEquals(value: RangeValue): Range {
    return new Range(value, null, RangeType.LESS_THAN_OR_EQUALS);
  }

  withPercentageOf(objectName: string): Range {
    return new Range(this.from, this.to, this.rangeType, objectName);
  }
}
