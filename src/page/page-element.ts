import { Rect } from "./rect.js";

export interface PageElement {
  getArea(): Promise<Rect>;
  isPresent(): Promise<boolean>;
  isVisible(): Promise<boolean>;
  getText(): Promise<string>;
  getCssProperty(name: string): Promise<string>;
}

export class AbsentPageElement implements PageElement {
  async getArea(): Promise<Rect> {
    return new Rect(0, 0, 0, 0);
  }

  async isPresent(): Promise<boolean> {
    return false;
  }

  async isVisible(): Promise<boolean> {
    return false;
  }

  async getText(): Promise<string> {
    return "";
  }

  async getCssProperty(): Promise<string> {
    return "";
  }
}

export class ScreenElement implements PageElement {
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}

  async getArea(): Promise<Rect> {
    return new Rect(0, 0, this.width, this.height);
  }

  async isPresent(): Promise<boolean> {
    return true;
  }

  async isVisible(): Promise<boolean> {
    return true;
  }

  async getText(): Promise<string> {
    return "";
  }

  async getCssProperty(): Promise<string> {
    return "";
  }
}

export class ViewportElement implements PageElement {
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}

  async getArea(): Promise<Rect> {
    return new Rect(0, 0, this.width, this.height);
  }

  async isPresent(): Promise<boolean> {
    return true;
  }

  async isVisible(): Promise<boolean> {
    return true;
  }

  async getText(): Promise<string> {
    return "";
  }

  async getCssProperty(): Promise<string> {
    return "";
  }
}
