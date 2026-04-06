import { Place } from "./place.js";

export abstract class Spec {
  originalText?: string;
  place?: Place;
  onlyWarn: boolean = false;
  alias?: string;
  properties: Record<string, string> = {};
  jsVariables: Record<string, unknown> = {};

  toText(): string {
    return this.alias ?? this.originalText ?? this.constructor.name;
  }

  withText(text: string): this {
    this.originalText = text;
    return this;
  }

  withPlace(place: Place): this {
    this.place = place;
    return this;
  }

  withOnlyWarn(): this {
    this.onlyWarn = true;
    return this;
  }

  withAlias(alias: string): this {
    this.alias = alias;
    return this;
  }

  withProperties(properties: Record<string, string>): this {
    this.properties = properties;
    return this;
  }

  withJsVariables(variables: Record<string, unknown>): this {
    this.jsVariables = variables;
    return this;
  }
}
