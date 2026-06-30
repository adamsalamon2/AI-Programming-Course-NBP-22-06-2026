---
name: reactive-form-disable-emitevent
description: Angular reactive form.disable() must use {emitEvent:false} when a valueChanges subscription calls updateValueAndValidity on a child control, or the form will not actually disable.
metadata:
  type: feedback
---

Always call `form.disable({ emitEvent: false })` (and `form.enable({ emitEvent: false })`) when the form has a `valueChanges` subscription that triggers `control.updateValueAndValidity()` on child controls.

**Why:** Without `emitEvent:false`, `form.disable()` emits value changes for all controls. If a subscription reacts by calling `updateValueAndValidity()` on a child, Angular re-recalculates the form's validity, which can un-disable the form (status stays INVALID instead of DISABLED). Confirmed in Angular 20 zoneless + Angular Material.

**How to apply:** Any time you disable/enable a reactive FormGroup that has a valueChanges subscription with side effects on other controls (e.g., a requestType toggle that updates reason validators), always pass `{ emitEvent: false }` to `disable()`/`enable()`.
