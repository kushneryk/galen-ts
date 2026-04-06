# galen-ts

Layout testing framework for web applications, powered by [Playwright](https://playwright.dev).

A TypeScript port of the [Galen Framework](http://galenframework.com) — uses the same `.gspec` language for describing layouts and validating element positions, sizes, and visual properties across different viewports.

## Installation

```bash
npm install galen-ts playwright
```

## Quick Start

```ts
import { Galen, HtmlReportBuilder } from 'galen-ts';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.setViewportSize({ width: 1024, height: 768 });

const report = await Galen.checkLayout(page, './specs/homepage.gspec', {
  sectionFilter: { includedTags: ['desktop'], excludedTags: [] },
});

console.log(`Passed: ${report.passed}, Errors: ${report.errors}, Warnings: ${report.warnings}`);

// Generate HTML report
new HtmlReportBuilder().build(report, './reports');

await browser.close();
```

## Galen Spec Language

Layout specs are written in `.gspec` files using the Galen Spec Language. The language describes page objects and their expected layout relationships.

### Objects

```gspec
@objects
    header              css     #header
    header-icon         css     #header img
    menu                id      main-menu
    login-button        xpath   //button[@id='login']
    menu-item-*         css     .menu-item
```

Supported locator types: `css`, `xpath`, `id`. If omitted, auto-detected (XPath if starts with `/`, CSS otherwise).

### Specs

```gspec
= Main Section =
    header:
        height 45 to 55px
        width 100% of viewport/width
        inside viewport 0px top, 0px left, 0px right

    login-button:
        visible
        inside header 5 to 15px top, 10 to 20px right
        text is "Log In"
        css font-size is "14px"

    menu:
        below header 0 to 5px
        width 150 to 180px

    header-icon:
        inside header 5px left
        above menu 20px
        centered vertically inside header 2px
```

### Available Specs

| Spec | Example | Description |
|------|---------|-------------|
| `width` | `width 100 to 200px` | Element width |
| `height` | `height 50px` | Element height |
| `above` | `above menu 10px` | Distance above another element |
| `below` | `below header 0 to 5px` | Distance below another element |
| `left-of` | `left-of button 20px` | Distance to the left |
| `right-of` | `right-of icon >= 10px` | Distance to the right |
| `inside` | `inside container 10px top, 5px left` | Contained within element |
| `inside partly` | `inside partly viewport 0px left` | Partially contained |
| `near` | `near button 5px left` | Distance from nearest edges |
| `aligned horizontally` | `aligned horizontally centered button` | Horizontal alignment |
| `aligned vertically` | `aligned vertically left menu` | Vertical alignment |
| `centered` | `centered on container` | Centered on/inside element |
| `text` | `text is "Hello"` | Text content validation |
| `text` | `text contains "welcome"` | Also: `starts`, `ends`, `matches` |
| `css` | `css font-size is "14px"` | CSS property validation |
| `visible` | `visible` | Element is visible |
| `absent` | `absent` | Element is absent |
| `contains` | `contains button, icon` | Contains child elements |
| `count` | `count any "menu-item-*" is 5` | Count matching elements |
| `component` | `component button.gspec` | Nested component spec |
| `image` | `image file "expected.png", error 2%` | Visual comparison |
| `color-scheme` | `color-scheme 40% white, 30% blue` | Color distribution |

### Range Syntax

```gspec
width 100px                     # exact
width 100 to 200px              # between
width > 50px                    # greater than
width >= 50px                   # greater than or equals
width < 200px                   # less than
width <= 200px                  # less than or equals
width ~ 100px                   # approximate (±2px)
width 50% of viewport/width     # percentage of reference
```

### Variables

```gspec
@set
    header_height   50
    main_color      rgba(0, 0, 0, 0.5)

= Main =
    header:
        height ${header_height}px
```

### Tags (Responsive Breakpoints)

```gspec
@on mobile
    = Mobile Layout =
        menu:
            width 100% of viewport/width

@on desktop
    = Desktop Layout =
        menu:
            width 250px
            inside viewport 0px left
```

```ts
const report = await Galen.checkLayout(page, 'layout.gspec', {
  sectionFilter: { includedTags: ['mobile'], excludedTags: [] },
});
```

### Loops

```gspec
@objects
    menu-item-*     css  .menu-item

@forEach [menu-item-*] as item, prev as prevItem
    ${item}:
        aligned horizontally all ${prevItem}

@for [1-5] as index
    menu-item-${index}:
        height 40px
```

### Groups

```gspec
@objects
    username_textfield      css  input[name='username']
    password_textfield      css  input[name='password']
    login_button            css  .btn-login
    cancel_button           css  .btn-cancel

@groups
    (textfield, textfields)     username_textfield, password_textfield
    (button, buttons)           login_button, cancel_button
    (form_element, form_elements)   &textfields, &buttons
```

### Conditionals

```gspec
@if ${isLoggedIn}
    user-panel:
        visible
@else
    login-form:
        visible
```

### Imports

```gspec
@import common.gspec
@import components/header.gspec
```

### Warnings

Prefix a spec with `%` to make it a warning instead of an error:

```gspec
header:
    % height 45 to 55px
```

## Reports

### HTML Report

```ts
import { HtmlReportBuilder } from 'galen-ts';

new HtmlReportBuilder().build(report, './reports');
// Generates: reports/report.html, reports/report.json
```

### JSON Report

```ts
import { JsonReportBuilder } from 'galen-ts';

new JsonReportBuilder().writeToFile(report, './reports/report.json');
```

### JUnit XML Report

```ts
import { JunitReportBuilder } from 'galen-ts';

new JunitReportBuilder().writeToFile(report, './reports/junit.xml', 'Layout Tests');
```

## Test Suites

For running multiple layout checks across pages and viewports, use the suite runner.

### Suite File Format (.test)

```
@@ set
    domain  https://example.com

Homepage on desktop
-------------------------------
    open ${domain}/
    resize 1024x768
    check homepage.gspec --include desktop

Homepage on mobile
-------------------------------
    open ${domain}/
    resize 320x568
    check homepage.gspec --include mobile

Login page
-------------------------------
    open ${domain}/login
    resize 1024x768
    check login.gspec --include desktop --exclude experimental
```

### Running Suites

```ts
import { SuiteReader, SuiteRunner } from 'galen-ts';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const tests = new SuiteReader().read('./suites/full.test');

const runner = new SuiteRunner();
const result = await runner.run(tests, {
  browser,
  parallel: true,
  concurrency: 4,
  onTestComplete: (r) => {
    const status = r.error ? 'FAIL' : 'PASS';
    console.log(`[${status}] ${r.test.title}`);
  },
});

console.log(`Total: ${result.totalPassed} passed, ${result.totalErrors} errors`);
await browser.close();
```

## Image Comparison

Image comparison requires a custom comparator (bring your own implementation using pixelmatch, sharp, or similar):

```ts
import { setImageComparator } from 'galen-ts';

setImageComparator(async (actual, expected, options) => {
  // Implement using pixelmatch, sharp, canvas, etc.
  return {
    percentage: 0.5,
    totalMismatchPixels: 120,
    offsetX: 0,
    offsetY: 0,
  };
});
```

## API Reference

### `Galen.checkLayout(page, spec, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `PlaywrightPage \| Page` | Playwright page or Page abstraction |
| `spec` | `string \| PageSpec` | Path to .gspec file or parsed PageSpec |
| `options.sectionFilter` | `{ includedTags, excludedTags }` | Tag-based filtering |
| `options.properties` | `Record<string, string>` | Properties for variable substitution |
| `options.variables` | `Record<string, unknown>` | JS variables available in specs |
| `options.screenshot` | `Buffer` | Pre-captured screenshot |
| `options.listener` | `ValidationListener` | Custom validation listener |

Returns `Promise<LayoutReport>`.

### `Galen.readSpec(specPath, options?)`

Parse a .gspec file without running validation.

### `Galen.readSpecFromText(text, options?)`

Parse .gspec text inline.

## Differences from Original Galen Framework

- **Playwright** instead of Selenium WebDriver
- **TypeScript** with full type safety
- **Async/await** instead of synchronous Java execution
- **Pluggable image comparator** instead of bundled Rainbow4J
- **ESM modules** instead of Java packages
- No OCR support (was Tesseract-based in original)
- No built-in Rhino JS engine — uses Node.js `Function` for expressions

## License

Apache License 2.0 — same as the original [Galen Framework](https://github.com/galenframework/galen).
