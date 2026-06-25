---
name: feedback_scss_use_import_order
description: SCSS @use rules must precede all other rules including @import; use url() syntax for CSS file imports placed after @use
metadata:
  type: feedback
---

SCSS requires all `@use` rules to appear before ANY other statement — including `@import` of CSS files.

**Why:** The Sass spec enforces this ordering. Putting `@import url("some.css")` before `@use` causes the compiler error: `@use rules must be written before any other rules`.

**How to apply:** In Angular Material SCSS setups, place `@use '@angular/material' as mat` first. Then include any CSS `@import url(...)` (such as self-hosted fonts) after all `@use` declarations. Use `@import url("path/fonts.css")` syntax (with `url()`) so Sass treats it as a plain CSS import passthrough rather than a Sass file import.
