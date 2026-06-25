# E2E Traceability Matrix — Hardware Service Decision Copilot

Maps each Playwright spec to the PRD Acceptance Criteria (AC-01…AC-27) and ADR-000 §10 test scenarios.

> **Status:** Step 3.1 — specs authored, not yet run to green.
> Extend this table at Step 3.3 as new scenarios are added.

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
| AC-11 | Return analysis evaluates usage/resellability | `return-approve.spec.ts` (verified via LLM output in first bubble) | |
| AC-12 | Complaint analysis evaluates damage/type/cause | `complaint-reject.spec.ts` (verified via LLM output) | |
| AC-13 | Vision prompt differs by request type | — | Backend unit test (TAC-05); not directly observable at E2E |
| AC-14 | Exactly one of Approve / Reject / Needs review | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` | |
| AC-15 | Decision logic uses matching policy | — | Backend integration test (TAC-06); policy injection not observable at E2E |
| AC-16 | Justification references concrete factors | `return-approve.spec.ts` · `complaint-reject.spec.ts` | Regex assertions on first bubble text |
| AC-17 | Needs review states specifically what is missing | `needs-review.spec.ts` | |
| AC-18 | Every decision includes advisory disclaimer | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` · `polish-text.spec.ts` | |
| AC-19 | Agent never states binding guarantee | — | Implicit via disclaimer assertion; no standalone test yet — TODO Step 3.3 |
| AC-20 | Chat opens with: greeting + decision + explanation + next steps + disclaimer (Markdown) | `return-approve.spec.ts` · `complaint-reject.spec.ts` · `needs-review.spec.ts` | |
| AC-21 | Customer can send follow-up messages and receive replies | `return-approve.spec.ts` · `chat-context.spec.ts` | |
| AC-22 | Agent has full context every chat turn | `chat-context.spec.ts` | |
| AC-23 | Agent incorporates new information provided in chat | `chat-context.spec.ts` | |
| AC-24 | Typing indicator visible while agent generates reply | `return-approve.spec.ts` · `chat-context.spec.ts` | TODO(3.2): depends on streaming timing |
| AC-25 | All user-facing text in Polish | `polish-text.spec.ts` (dedicated) + assertions in all other specs | |
| AC-26 | LLM failure → non-technical retryable error; no fabricated decision | — | TODO Step 3.3: requires backend failure injection |
| AC-27 | Off-topic requests politely declined + redirected | `chat-context.spec.ts` | |

---

## ADR-000 §10 Test Scenario Coverage

| Scenario | Spec | Notes |
|----------|------|-------|
| Valid return → Approve (within 14 days, unused image) | `return-approve.spec.ts` | Edge: exactly day 14 |
| Valid complaint → Reject (cracked-screen image, mechanical damage) | `complaint-reject.spec.ts` | Edge: alternative (paid repair) asserted |
| Ambiguous → Needs review (blurry/unusable image) | `needs-review.spec.ts` | Edge: inconsistent date (day 20 for Zwrot) |
| Invalid submission (missing field / future date / empty reason / wrong format / >10 MB) | `invalid-submission.spec.ts` | All sub-cases covered |
| AI unavailable → retryable error, no fabricated decision | — (TAC) | TODO Step 3.3 |
| Chat context: follow-up reflects form data + image analysis + new info | `chat-context.spec.ts` | |
| Off-topic → polite decline + redirect | `chat-context.spec.ts` | |
| Streaming: SSE emits tokens then completes; mid-stream error | — (TAC) | TODO Step 3.3 |
| Polish text: all labels/errors/buttons/decisions in Polish | `polish-text.spec.ts` | |

---

## TODO for Step 3.3

- [ ] AC-26 / AI unavailable: add a test that intercepts the backend network call and simulates a 503; assert retryable error shown, no /chat navigation.
- [ ] AC-19 / binding guarantee: add assertion that the first bubble does NOT contain phrases like "gwarantuję", "na pewno zostanie", etc.
- [ ] Streaming SSE test: intercept SSE stream to verify multiple token events before the terminal event.
- [ ] Nowa sprawa restart: verify that clicking "Nowa sprawa" returns to a fresh blank form.
- [ ] TAC-09: unknown sessionId → 404 surfaced as "start new case" prompt.
- [ ] Cross-browser: enable Firefox and WebKit projects once the basic suite is green.
- [ ] Mobile viewport: add mobile project once the responsive layout is confirmed.
