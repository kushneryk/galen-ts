# Changelog

All notable changes to galen-ts are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), newest first.

## [0.1.3] — 2026-04-15

### Fixed

- `~ N% of reference` in `width` / `height` / other range specs is now
  correctly parsed as `Range.between(N-2, N+2).withPercentageOf(reference)`,
  matching original Java Galen behavior. Previously the `~` prefix was
  silently swallowed on percentage ranges and the spec parsed as an exact
  percentage, so sub-pixel rendering (e.g. a table at 99.7% of its container)
  would fail a `width ~ 100% of container/width` check.

### Changed

- Parser now accepts an optional `~` prefix on error rates in `aligned`,
  `centered`, and `image` specs — e.g. `aligned horizontally centered ~ 8px`
  or `image file "expected.png", error ~ 2%`. Error rate is already a
  tolerance, so the tilde is purely readability sugar. Note: this is a
  galen-ts extension — original Java Galen rejects `~` on error rates.

## [0.1.2] — 2026-04-06

### Changed

- Async percentage reference resolution (`objectName/width`).
- Linter fixes.

## [0.1.1] — 2026-04-06

### Added

- Full implementation of remaining Galen spec-language features:
  `@rule`, `@lib`, `@script`, `@grouped`, object corrections, `#` wildcard,
  `&group` references, centered direction (`horizontally` / `vertically`),
  rich JS `find()` / `first()` / `last()` with `.left` / `.right` / `.top`
  / `.bottom` / `.width` / `.height`, `parent` / `self` / `global` special
  objects, image filters, color-scheme percentages.
- npm publishing configuration.

## [0.1.0] — 2026-04-06

### Added

- Initial release: TypeScript port of the Galen Framework, backed by
  Playwright instead of Selenium. Spec parser, validation engine, and
  HTML / JSON / JUnit reports.
