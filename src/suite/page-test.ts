import { PageAction } from "./page-action.js";

export interface PageTestSize {
  width: number;
  height: number;
}

export class PageTest {
  constructor(
    public readonly title: string,
    public readonly url?: string,
    public readonly size?: PageTestSize,
    public readonly actions: PageAction[] = [],
    public readonly groups: string[] = [],
    public readonly disabled: boolean = false,
  ) {}
}
