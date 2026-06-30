# FE Developer Agent Memory

- [Angular 20 zoneless API name](feedback_angular20_zoneless.md) — use `provideZonelessChangeDetection` (not Experimental); keep zone.js only in test polyfills
- [SCSS @use/@import ordering](feedback_scss_use_import_order.md) — `@use` must come first; use `url()` syntax for CSS file imports placed after `@use`
- [Angular 20 frontend scaffold](project_angular_frontend_scaffold.md) — ngx-markdown needs --legacy-peer-deps + marked^12; @angular/animations must be installed manually
- [Reactive form disable with emitEvent](feedback_reactive_form_disable.md) — always use `form.disable({emitEvent:false})` when valueChanges subscription calls updateValueAndValidity on children
- [Blocked-submit feedback banner](feedback_blocked_submit_banner.md) — signal + testable getFirstInvalidControlName() + reuse .submit-error; reactive clear via statusChanges/applyFile, never auto-show
