import { Page } from "../page/page.js";

export interface Size {
  width: number;
  height: number;
}

export interface Browser {
  load(url: string): Promise<void>;
  changeWindowSize(size: Size): Promise<void>;
  getPage(): Page;
  getUrl(): Promise<string>;
  getScreenSize(): Promise<Size>;
  executeJavascript(script: string): Promise<unknown>;
  refresh(): Promise<void>;
  quit(): Promise<void>;
}
