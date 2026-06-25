# E2E Traceability Matrix — Hardware Service Decision Copilot

Maps each Playwright spec to the PRD Acceptance Criteria (AC-01…AC-27) and ADR-000 §10 test scenarios.

> **Status:** Step 3.2 complete — selectors reconciled against live DOM. Suite result: **14 passed / 12 failed**.
> All 12 failures are caused by a single backend bug (see Known Backend Bugs below).
> Non-LLM tests (7 invalid-submission + 4 polish-text UI) all pass. Extend at Step 3.3.

---

## Assertion Strategy (Step 3.2 Decision)

### LLM-driven verdict tests (return-approve, complaint-reject, needs-review, chat-context, polish-text)
Test fixtures are tiny synthetic images (≤152 bytes). A real vision model cannot derive a specific
APPROVE/REJECT/NEEDS_REVIEW verdict from them. Therefore:

- **Assert STRUCTURE**: app navigates to `/chat`; first agent bubble contains one of the three Polish
  verdict labels (`Pozytywna opinia` / `Negatywna opinia` / `Wymaga weryfikacji`); non-empty
  justification (>50 chars); advisory disclaimer; all visible text is Polish.
- **Assert follow-up**: typing indicator appears (or response is fast); agent streams a non-empty reply.
- **Assert off-topic**: agent reply contains on-topic redirect keywords.
- Do NOT assert a specific verdict string from tiny synthetic fixture content.

### Client-side validation tests (invalid-submission)
These are deterministic — no LLM call, no navigation to `/chat`. Hard assertions on:
- Specific Polish error messages from `pl.ts errors.*`
- No URL change to `/chat`

---

## Selector Reference (confirmed 2026-06-25 against live Angular Material DOM)

| Element | Playwright locator |
|---|---|
| Request type radiogroup | `getByRole('radiogroup', { name: 'Rodzaj wniosku' })` |
| Reklamacja radio | `getByRole('radio', { name: 'Reklamacja' })` |
| Zwrot radio | `getByRole('radio', { name: 'Zwrot' })` |
| Category combobox | `getByRole('combobox', { name: 'Kategoria sprzętu' })` |
| Category option | `getByRole('option', { name: '<category>' })` |
| Model input | `getByLabel('Nazwa / model urządzenia')` |
| Purchase date input | `getByLabel('Data zakupu')` |
| Reason textarea (Reklamacja) | `getByLabel(/Opis powodu wymagane/i)` |
| Reason textarea (Zwrot) | `getByLabel(/Opis powodu opcjonalne/i)` |
| Reason textarea (any) | `getByLabel(/Opis powodu/)` |
| File input | `locator('input[type="file"][aria-label="Prześlij zdjęcie urządzenia"]')` |
| Submit button | `getByRole('button', { name: 'Wyślij wniosek' })` |
| Validation errors | `locator('mat-error')` |
| Assistant bubble(s) | `locator('.message-bubble--assistant')` |
| Typing indicator | `locator('.typing-indicator')` (role="status") |
| Chat input | `getByPlaceholder('Napisz wiadomość…')` |
| Send button | `getByRole('button', { name: 'Wyślij wiadomość' })` |
| Nowa sprawa | `getByRole('button', { name: 'Rozpocznij nową sprawę' })` |

---

## AC Coverage

| AC | Description (abbreviated) | Covered by spec(s) | Notes |
|----|----------------------------|--------------------|-------|
| AC-01 | Request type selector: exactly Reklamacja and Zwrot | `polish-text.spec.ts` · `complaint-reject.spec.ts` · `return-approve.spec.ts` | |
| AC-02 | Equipment category dropdown — predefined list | `polish-text.spec.ts` · `return-approve.spec.ts` | All 11 categories asserted in `polish-text` |
| AC-03 | Free-text model input | `return-approve.spec.ts` · `complaint-reject.spec.ts` | |
| AC-04 | Purchase date not in future — rejected with inline error | `invalid-submission.spec.ts` · `return-approve.spec.ts` (edge: day 14) | |
| AC-05 | Reason required for Reklamacja, optional for Zwrot | `invalid-submission.spec.ts` · `complaint-reject.spec.ts` · `polish-text.spec.ts` | |
| AC-06 | Exactly one image required; blocked if missing | `invalid-submission.spec.ts` | |
| AC-07 | Image type: JPEG/PNG/WebP only; other types rejected with Polish error naming formats | `invalid-submission.spec.ts` | |
| AC-08 | Image > 10 MB rejected with Polish inline error stating 10 MB limit | `invalid-submission.spec.ts` | |
| AC-09 | No LLM call until all validation passes (no navigation to /chat on invalid) | `invalid-submission.spec.ts` (all tests assert no /chat navigation) | |
| AC-10 | Image compressed before LLM send | — | Backend integration test (TAC-02); not tested at E2E layer |
| AC-11 | Return analysis evaluates usage/resellability | `return-approve.spec.ts` (structural assertion on first bubble) | Structural only — fixture too small for visual analysis |
| AC-12 | Complaint analysis evaluates damage/type/cause | `complaint-reject.spec.ts` (structural assertion) | Structural only |
| AC-13 | Vision prompt differs by request type | — | Backend unit test (TAC-05); not directly observable at E2E |
| AC-14 | Exactly one of Approve / Reject / Needs review | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` | Asserted via Polish label regex |
| AC-15 | Decision logic uses matching policy | — | Backend integration test (TAC-06); not observable at E2E |
| AC-16 | Justification references concrete factors | `return-approve.spec.ts` · `complaint-reject.spec.ts` | Length > 50 chars asserted |
| AC-17 | Needs review states specifically what is missing | `needs-review.spec.ts` | First bubble length > 50 chars |
| AC-18 | Every decision includes advisory disclaimer | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` · `polish-text.spec.ts` | Regex on Polish advisory keywords |
| AC-19 | Agent never states binding guarantee | — | Implicit via disclaimer assertion; standalone test TODO Step 3.3 |
| AC-20 | Chat opens with decision + explanation + next steps + disclaimer | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` | |
| AC-21 | Customer can send follow-up messages and receive replies | `return-approve.spec.ts` · `chat-context.spec.ts` | |
| AC-22 | Agent has full context every chat turn | `chat-context.spec.ts` | |
| AC-23 | Agent incorporates new information provided in chat | `chat-context.spec.ts` | |
| AC-24 | Typing indicator visible while agent generates reply | `chat-context.spec.ts` | Tolerates fast streaming |
| AC-25 | All user-facing text in Polish | `polish-text.spec.ts` (dedicated) + assertions in all other specs | |
| AC-26 | LLM failure → non-technical retryable error; no fabricated decision | — | TODO Step 3.3: requires backend failure injection |
| AC-27 | Off-topic requests politely declined + redirected | `chat-context.spec.ts` | Regex on redirect/decline keywords |

---

## ADR-000 §10 Test Scenario Coverage

| Scenario | Spec | Notes |
|----------|------|-------|
| Valid return → structural decision (within 14 days) | `return-approve.spec.ts` | Edge: exactly day 14; structural only |
| Valid complaint → structural decision (cracked-screen image) | `complaint-reject.spec.ts` | Structural only; tiny fixture |
| Ambiguous → structural decision (blurry/minimal image) | `needs-review.spec.ts` | Structural only; tiny fixture |
| Invalid submission (missing field / future date / empty reason / wrong format / >10 MB) | `invalid-submission.spec.ts` | All sub-cases covered; hard assertions |
| AI unavailable → retryable error, no fabricated decision | — (TAC) | TODO Step 3.3 |
| Chat context: follow-up reflects form data + image analysis + new info | `chat-context.spec.ts` | |
| Off-topic → polite decline + redirect | `chat-context.spec.ts` | |
| Streaming: SSE emits tokens then completes; mid-stream error | — (TAC) | TODO Step 3.3 |
| Polish text: all labels/errors/buttons/decisions in Polish | `polish-text.spec.ts` | |

---

## Known Backend Bugs (Step 3.2 findings)

### BUG-001: DecisionEngine fails with 400 when word "json" absent from prompt
- **Component:** `app/backend/src/main/java/pl/nbp/copilot/ai/DecisionEngine.java` line 53
- **Root cause:** `DecisionEngine.decide()` sets `response_format: json_object` on the OpenAI call.
  The `gpt-5.4-mini` model (Azure provider) requires the word "json" to appear somewhere in the
  messages. `PromptFactory.buildDecisionSystemPrompt()` does not include "json" anywhere.
- **Error:** `com.openai.errors.BadRequestException: 400: Provider returned error`
  — Azure message: "Response input messages must contain the word 'json' in some form to use
  'text.format' of type 'json_object'."
- **Impact:** All 12 LLM-dependent E2E tests fail; form never navigates to `/chat`.
- **Fix needed (in backend):** Add phrase like "Odpowiedz w formacie JSON." to the decision prompt,
  OR switch from `ResponseFormatJsonObject` to `ResponseFormatJsonSchema` with a named schema.
- **Confirmed:** 2026-06-25, backend PID 8152 (started with valid `OPENROUTER_API_KEY`).

---

## TODO for Step 3.3

- [ ] AC-26 / AI unavailable: intercept backend network call, simulate 503; assert retryable error shown, no /chat navigation.
- [ ] AC-19 / binding guarantee: assert first bubble does NOT contain phrases like "gwarantuję", "na pewno zostanie", etc.
- [ ] Streaming SSE test: intercept SSE stream to verify multiple token events before terminal event.
- [ ] Nowa sprawa restart: verify "Rozpocznij nową sprawę" returns to a fresh blank form.
- [ ] TAC-09: unknown sessionId → 404 surfaced as "start new case" prompt.
- [ ] Cross-browser: enable Firefox and WebKit projects once basic suite is green.
- [ ] Mobile viewport: add mobile project once responsive layout is confirmed.
- [ ] Replace tiny synthetic fixtures with real photographic content to enable specific verdict assertions.
