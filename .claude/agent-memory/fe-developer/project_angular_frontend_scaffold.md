---
name: project_angular_frontend_scaffold
description: Angular 20 frontend scaffold completed; ngx-markdown uses --legacy-peer-deps; @angular/animations must be installed separately
metadata:
  type: project
---

Angular 20 frontend scaffold landed in `app/frontend/` at commit `195688c` on branch `feat/poc-implementation` (2026-06-25).

Key facts:
- Angular 20.3.25 / Angular Material 20.2.14 / ngx-markdown 18.1.0 (with `--legacy-peer-deps`) / marked pinned to ^12 / @microsoft/fetch-event-source installed
- `@angular/animations` is NOT auto-installed by `ng add @angular/material` — must be installed manually (`npm install @angular/animations`); without it, `provideAnimationsAsync` causes a build error.
- ngx-markdown 18 requires Angular 18 peers but works at runtime with Angular 20 when installed with `--legacy-peer-deps`.
- ngx-markdown 18 requires `marked >= 9 < 13`; the standalone `marked` package is now at v18 — pin explicitly to `^12`.

**Why:** These constraints are non-obvious and not documented in the Angular CLI output.

**How to apply:** Use these exact install commands for future Angular 20 projects: install `@angular/animations` after `ng add @angular/material`; install ngx-markdown with `--legacy-peer-deps` and pin marked to 12.
