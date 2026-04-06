import { describe, it, expect } from "vitest";
import {
  PageActionOpen, PageActionResize, PageActionCheck,
  PageActionRunJavascript, PageActionWait, PageActionInjectJavascript,
} from "../../src/suite/page-action.js";

describe("PageActionOpen", () => {
  it("constructs with url and originalCommand", () => {
    const a = new PageActionOpen("http://example.com");
    expect(a.url).toBe("http://example.com");
    expect(a.originalCommand).toBe("open http://example.com");
  });
});

describe("PageActionResize", () => {
  it("constructs with width, height", () => {
    const a = new PageActionResize(1024, 768);
    expect(a.width).toBe(1024);
    expect(a.height).toBe(768);
    expect(a.originalCommand).toBe("resize 1024x768");
  });
});

describe("PageActionCheck", () => {
  it("constructs with specPath", () => {
    const a = new PageActionCheck("home.gspec");
    expect(a.specPath).toBe("home.gspec");
    expect(a.originalCommand).toBe("check home.gspec");
  });
});

describe("PageActionRunJavascript", () => {
  it("constructs with script", () => {
    const a = new PageActionRunJavascript("alert(1)");
    expect(a.script).toBe("alert(1)");
  });
});

describe("PageActionWait", () => {
  it("constructs with milliseconds", () => {
    const a = new PageActionWait(500);
    expect(a.milliseconds).toBe(500);
    expect(a.originalCommand).toBe("wait 500ms");
  });
});

describe("PageActionInjectJavascript", () => {
  it("constructs with scriptPath", () => {
    const a = new PageActionInjectJavascript("/path/to/script.js");
    expect(a.scriptPath).toBe("/path/to/script.js");
  });
});
