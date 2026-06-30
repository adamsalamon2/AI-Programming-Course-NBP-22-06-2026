---
name: blocked-submit-feedback-pattern
description: Pattern for showing a top-level validation summary banner on blocked submit in Angular reactive forms, with testable scroll/focus logic
metadata:
  type: feedback
---

When a reactive-form submit is blocked by validation, the pattern used in this project is:

1. Add a `readonly formIncomplete = signal(false)` alongside `submitError`.
2. Expose a `getFirstInvalidControlName(): string | null` method that walks controls in DOM order (requestType → category → model → purchaseDate → reason → image) so it can be unit-tested without DOM scroll/focus.
3. In `onSubmit()`: set `formIncomplete.set(true)` on early return, set `formIncomplete.set(false)` before the happy path proceeds.
4. Call `focusFirstInvalid()` (private method using ElementRef) on blocked submit; skip in tests (jsdom doesn't support scroll/focus properly).
5. Reuse the existing `.submit-error` SCSS class and markup pattern (`role="alert"`, `mat-icon`, `<span>`) for the new banner — keeps visual consistency.
6. Add `data-testid="form-incomplete-banner"` to the banner for reliable DOM queries in tests.
7. Add the i18n key to `pl.ts` errors block; banner text: `formIncomplete: 'Uzupełnij wymagane pola zaznaczone na czerwono.'`
8. Clear the banner reactively (never auto-show): subscribe to `form.statusChanges` in ngOnInit guarded by `formIncomplete() && getFirstInvalidControlName() === null`, and repeat the same check in `applyFile()` (the image is a signal, not a form control, so statusChanges never fires for it). Add the subscription to the existing `subscriptions` for cleanup.

**Why:** Users on longer forms miss inline red errors and perceive "nothing happens". The banner near the submit button gives screen-reader-announced (role=alert) and visual feedback. Pattern mirrors existing `submitError` to keep code consistent.

**How to apply:** Any form that needs a blocked-submit summary should follow this exact signal + testable-method + reuse-submit-error pattern. Do NOT introduce new SCSS classes unless the styling must differ significantly. Relates to [[reactive-form-disable-emitevent]].
