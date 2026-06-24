---
name: caveman
description: >-
  Write brutally simple, dumb-obvious code — no abstractions, no cleverness, no
  premature generalization. Flat, explicit, boring code that anyone can read top
  to bottom with zero context. Use this skill whenever the user asks for code
  that is "caveman style", "dumb simple", "as simple as possible", "no
  abstractions", "no magic", "just make it work", "stop over-engineering",
  "keep it flat", "boring code", or otherwise signals they want the most direct,
  unclever implementation over an elegant or extensible one. Also use it when
  refactoring existing code down to its simplest possible form on request.
---

# Caveman

Caveman writes code the way a tired human reads it: top to bottom, no surprises,
no hunting. The goal is code so plain that a reader understands it fully without
jumping to another file, holding a mental model, or trusting a clever trick. You
trade elegance, brevity, and extensibility for one thing only: **immediate
obviousness.**

This is a deliberate style the user opts into. Apply it only to the code they
asked for in caveman style — don't go reformat the whole codebase.

## The one rule

If a reader has to pause and think "wait, what does this do?", you failed. Make
it dumber.

## How caveman writes code

**Inline over indirect.** Don't extract a helper used once. Don't add a layer
"in case." If logic runs in one place, write it in that place. A reader should
not have to chase a call to understand a step.

**Explicit over implicit.** Spell out the steps. No metaprogramming, no dynamic
dispatch tricks, no clever one-liners that pack three operations into a
comprehension. If a loop is clearer than a reduce, write the loop.

**Few names, plain names.** Name things what they are: `total`, `userList`,
`isValid`. No `mgr`, no `_doProcess`, no abstract `Handler`/`Strategy`/`Factory`
when a function will do. Fewer concepts to track = faster reading.

**Flat over nested.** Prefer early returns and guard clauses to deep `if/else`
pyramids. Handle the bad cases first and bail, then write the happy path flat at
the bottom.

**Boring data, boring control flow.** Plain variables, arrays, and maps over
custom classes and wrappers. A straight sequence of statements over a state
machine. If a `switch`/`if` chain works, don't build a dispatch table.

**Repetition is fine.** Two similar blocks that read clearly beat one clever
abstraction that forces the reader to mentally re-expand it. Don't DRY things up
just because you can — only collapse duplication when it genuinely reduces what
the reader must understand.

**No speculative generality.** No config flags, hooks, or extension points for
features that don't exist yet. Build exactly what was asked, nothing for the
imagined future. The simplest code to change later is code that's easy to read
now.

## Why this works

Most "sophisticated" code is optimized for the author's sense of elegance or for
a flexibility that never gets used. The cost is paid every single time someone
reads it — and code is read far more than it's written. Caveman moves the cost
back to writing (more lines, more repetition) to make reading free. That's a
good trade when the user wants something they can verify at a glance, hand to a
junior, or ship fast without a maze of indirection.

## What caveman is NOT

- **Not sloppy.** Still correct, still handles errors, still named clearly. Dumb
  ≠ buggy. Caveman code is *more* careful about edge cases because it handles
  them inline where you can see them.
- **Not unformatted.** Follow the project's formatter/linter and language idioms.
  Simple is not an excuse for messy.
- **Not a license to ignore real constraints.** If something genuinely needs a
  library, a real data structure for performance, or a security control, use it.
  Caveman fights *needless* complexity, not necessary complexity. If avoiding an
  abstraction would actually make the code wrong or unreadably long, say so and
  use the minimum that keeps it clear.

## Examples

**Example 1 — inline over a single-use helper**

Input: "Sum the prices, caveman style."

Clever (avoid):
```js
const total = items.reduce((acc, { price }) => acc + price, 0);
```

Caveman:
```js
let total = 0;
for (const item of items) {
  total = total + item.price;
}
```

**Example 2 — guard clauses, flat happy path**

Input: "Validate and save the user, keep it dumb simple."

Caveman:
```js
function saveUser(user) {
  if (!user.email) return { ok: false, error: "Email required" };
  if (!user.name)  return { ok: false, error: "Name required" };

  db.insert(user);
  return { ok: true };
}
```
No nested `if`s, no validation framework, no `Result` monad. Bail early, then
the success path sits flat at the end.

**Example 3 — repetition over a forced abstraction**

Input: "Format both the start and end dates."

Caveman (fine — clear and obvious):
```js
const startText = `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
const endText   = `${end.getFullYear()}-${end.getMonth() + 1}-${end.getDate()}`;
```
Two lines you can read at a glance beat a `formatDate` abstraction the reader has
to go find — unless this formatting is needed in many places, in which case one
plain named function is the simpler thing to track.

## When you finish

If you had to add any real complexity (a library, a non-obvious data structure,
an unavoidable abstraction), call it out in one sentence so the user knows where
the code stopped being caveman-simple and why.
