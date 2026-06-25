# Hardware Service Decision Copilot — E2E Tests (Playwright)

Playwright E2E test suite for the Hardware Service Decision Copilot PoC.

---

## Prerequisites

Before running the full suite you need **both services running** locally:

### 1. Backend (Spring Boot on :8080)

```bash
# Requires a real OpenRouter API key in app/.env
# See app/.env.example for required variables (OPENROUTER_API_KEY is mandatory)
cd app/backend
mvn spring-boot:run
```

Health check: `curl http://localhost:8080/api/health` → `{"status":"UP"}`

### 2. Frontend (Angular on :4200)

```bash
cd app/frontend
ng serve --port 4200
```

Open: http://localhost:4200

---

## Installation

```bash
cd app/e2e
npm install
npx playwright install chromium   # install browser binaries
```

---

## Running Tests

```bash
# List all tests (Step 3.1 verification — no server needed)
npm run test:list

# Run only client-side validation tests (no LLM needed, Step 3.1+)
npm run test:invalid

# Run smoke tests (requires full stack)
npm run test:smoke

# Run all tests
npm test

# Run with browser visible (debugging)
npm run test:headed

# Open Playwright UI mode
npm run test:ui
```

---

## Project Structure

```
app/e2e/
  playwright.config.ts        Playwright configuration (baseURL :4200, timeouts for LLM)
  package.json                Standalone npm project
  tsconfig.json               TypeScript configuration
  README.md                   This file
  traceability.md             PRD AC → spec mapping

  pages/
    intake-form.page.ts       Page Object — Intake Form screen (/)
    chat.page.ts              Page Object — Chat screen (/chat)

  fixtures/
    index.ts                  Fixture path constants
    generate-fixtures.ts      Script that generates binary fixture files
    unused-device.jpg         Minimal JPEG — unused device (Zwrot / Approve)
    cracked-screen.png        Minimal PNG — cracked screen (Reklamacja / Reject)
    blurry-photo.webp         Minimal WebP — ambiguous photo (Needs review)
    oversized-image.jpg       JPEG header + 11 MB padding (AC-08 invalid size)
    wrong-type.gif            GIF file (AC-07 invalid format)

  tests/
    return-approve.spec.ts    Zwrot → Approve decision + follow-up (AC-01/05/14/18/20/21/22/23/24)
    complaint-reject.spec.ts  Reklamacja → Reject + alternative (AC-05/12/14/16/18/20/21)
    needs-review.spec.ts      Blurry photo → Needs review + clarification (AC-14/17/18/20/21/23)
    invalid-submission.spec.ts Client-side validation errors (AC-04/05/06/07/08/09) — no LLM needed
    chat-context.spec.ts      Follow-up + new info + off-topic handling (AC-21/22/23/24/27)
    polish-text.spec.ts       All user-facing text is Polish (AC-01/02/25)
```

---

## Selector Assumptions (TODO(3.2))

Many selectors in the Page Objects are marked `// TODO(3.2): confirm selector`.
These are best-effort guesses based on the Angular Material + Angular 20 component
structure described in ADR-003. Before Step 3.2 green run:

1. Start the frontend (`ng serve`).
2. Open DevTools and inspect: request-type toggle, category mat-select, mat-error elements,
   chat message bubbles, typing indicator, "Nowa sprawa" button.
3. Update the selectors in `pages/intake-form.page.ts` and `pages/chat.page.ts`.
4. Run `npm run test:invalid` first (client-side only) to get quick feedback.

Key unknowns:
- Polish label text for: model input, purchase date, reason, submit button.
- `mat-button-toggle-group` vs radio — determines `reklamacjaButton` / `zwrotButton` selector.
- Chat message bubble CSS class / data attribute.
- Typing indicator selector (TypingIndicatorComponent output).
- Exact Polish verdict labels returned by the LLM.
- Exact Polish disclaimer phrasing returned by the LLM.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:4200` | Override frontend URL |
| `CI` | — | When set: stricter mode, no open reports, 1 retry |

---

## Test Timeouts

The config uses generous timeouts because real LLM calls can take several seconds:
- Per-test: 120 s
- Per-assertion: 15 s
- Navigation: 30 s

Tests run **sequentially** (`workers: 1`) to avoid OpenRouter rate-limit bursts.
