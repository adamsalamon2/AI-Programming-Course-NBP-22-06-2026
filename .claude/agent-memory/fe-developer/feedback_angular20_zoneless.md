---
name: feedback_angular20_zoneless
description: Angular 20 uses provideZonelessChangeDetection (not Experimental), zone.js must stay in test polyfills but removed from build polyfills
metadata:
  type: feedback
---

In Angular 20, the correct API is `provideZonelessChangeDetection()` — NOT `provideExperimentalZonelessChangeDetection()` which was the Angular 18/19 name.

**Why:** The experimental API was stabilized and renamed between Angular 18→20. Using the old name produces a TS2724 compile error.

**How to apply:** When scaffolding Angular 20 with zoneless CD, use `provideZonelessChangeDetection` in both `app.config.ts` and `TestBed.configureTestingModule`. Keep `zone.js` + `zone.js/testing` in the `test` polyfills (Karma requires it) but remove `zone.js` from the `build` polyfills to avoid the NG0914 warning in production.
