# Implementation Plan — Hardware Service Decision Copilot (PoC)

> **Status:** DRAFT — awaiting user approval before any delegation.
> **Role of this document:** orchestration plan. It defines the phases, the small TDD steps,
> the commit points, the cross-agent dependency matrix, and the **exact context brief** that the
> orchestrator will hand to each specialized agent (`be-developer`, `fe-developer`, `qa-engineer`)
> for each step. The orchestrator does not write production code; it only dispatches and sequences.

## 0. Locked decisions (from clarification)

| # | Decision | Choice |
|---|---|---|
| 1 | This turn | Plan only; execute after approval |
| 2 | LLM key | Live OpenRouter key supplied by user → goes into `app/.env` (gitignored), never committed |
| 3 | Scope | **Full**: every PRD acceptance criterion (AC-01..27) and every ADR TAC |
| 4 | Run/package | **Local run** only (`mvnw spring-boot:run`, `npx ng serve`); Dockerfiles/compose deferred |
| 5 | Models | Text + Vision both `openai/gpt-5.4-mini` (`.env.example` defaults) |
| 6 | Git | Single feature branch off `main`; sequenced commits |

**Toolchain on this machine (verified):** JDK 25 ✓, Node 24 / npm 11 ✓. `mvn` and `ng` are **not**
on PATH → backend uses the generated **Maven wrapper `./mvnw`**, frontend uses **`npx @angular/cli`**.
Docker compose v2 plugin does not resolve — irrelevant given decision #4.

**Source docs (do not duplicate; agents are told which sections to read):**
PRD `docs/PRD-Product-Requirements-Document.md`; ADRs `docs/ADR/000-main-architecture.md`,
`001-backend-spring-boot.md`, `002-ai-integration-openrouter.md`, `003-frontend-angular.md`;
design `docs/design-guidelines.md` + `assets/`; policies `docs/policies/*.md`.

---

## 1. Agents & ownership

| Agent | Owns (subtree) | Never touches |
|---|---|---|
| `be-developer` | `app/backend/**`, `app/.env`, root `.gitignore`, `app/AGENTS.md` (Phase 0 only) | `app/frontend/**`, `app/e2e/**` |
| `fe-developer` | `app/frontend/**` | `app/backend/**`, `app/e2e/**` |
| `qa-engineer` | `app/e2e/**` (Playwright project) | `app/backend/src/**`, `app/frontend/src/**` (proposes fixes; owning dev applies) |

Because the three subtrees never overlap, sequenced commits on one branch cannot produce merge
conflicts. The orchestrator still serializes the *commit instant* per the dependency matrix (§7).

---

## 2. Global conventions (handed to every agent)

**TDD micro-cycle — mandatory for every step:**
1. Read only the cited spec lines for this step.
2. Write/extend the failing test(s) first; run them; confirm they **fail for the expected reason**.
3. Implement the minimum to pass.
4. Run the step's verification (below) — all green, no warnings in scope.
5. Refactor while green.
6. Commit (focused, one logical change).

**Verification commands:**
- Backend (run from `app/backend`): `./mvnw -q test` · `./mvnw -q -DskipTests package` · `./mvnw spring-boot:run` (smoke).
- Frontend (run from `app/frontend`): `npx ng test --watch=false --browsers=ChromeHeadless` · `npx ng build` · `npx ng serve` (smoke).
- E2E (run from `app/e2e`): `npx playwright test`.

**Commit message format:** `Area: short summary` — `Backend:`, `Frontend:`, `Tests:`, `Docs:`.
No pushing to remote. Commit only after the step's verification passes.

**Branch:** orchestrator creates `feat/poc-implementation` off `main` in Phase 0; all work lands there.

**Definition of done per step:** tests written first and passing honestly; scoped verification green;
commit focused; repo in a runnable state.

---

## 3. Frozen API & type contract (shared by be + fe; set in Phase 0, do not drift)

Both developers receive this verbatim so frontend can build against mocks while backend builds.

**Categories enum** — wire key → Polish label (used by both ends):
`SMARTFONY→Smartfony, LAPTOPY→Laptopy, TABLETY→Tablety, TELEWIZORY→Telewizory, SLUCHAWKI→Słuchawki,`
`SMARTWATCHE→Smartwatche, KONSOLE→Konsole do gier, AUDIO→Sprzęt audio, APARATY→Aparaty fotograficzne,`
`AKCESORIA→Akcesoria, INNE→Inne`. FE sends the **key**; FE renders the **label**.

**POST `/api/cases`** — `multipart/form-data`:
fields `requestType` (`COMPLAINT|RETURN`), `category` (enum key), `model` (string),
`purchaseDate` (`yyyy-MM-dd`), `reason` (string, optional), `sessionId` (client UUID), `image` (file part).
→ **200** `CaseResponse`:
```jsonc
{ "sessionId": "uuid",
  "decision": { "verdict": "APPROVE|REJECT|NEEDS_REVIEW",
                "justification": "pl", "nextSteps": "pl",
                "disclaimer": "pl", "missingInfo": "pl|null" },
  "caseSummary": { "requestType": "...", "category": "...", "model": "...", "purchaseDate": "..." } }
```
→ **400** `ApiError` `{ "code": "...", "message": "pl", "fieldErrors": [{ "field": "...", "message": "pl" }] }` (no LLM call)
→ **413/400** oversized upload · **502/503** `ApiError` retryable (no fabricated decision).

**POST `/api/chat/stream`** — JSON `{ "sessionId": "...", "message": "..." }`, `Accept: text/event-stream`
→ SSE `data:` token events, terminal `complete` event; mid-stream `error` event; **404** unknown/expired session.

**GET `/api/health`** → `{ "status": "UP" }`.

---

## 4. PHASE 0 — Foundations (BLOCKING; gates all other phases)

> 0.1 (be) and 0.2 (fe) run **in parallel** (separate subtrees). Both must be green before Phase 1/2.

### Step 0.1 — Backend scaffold + health endpoint  · `be-developer`
- **Depends on:** none.
- **Context brief to agent:** Read ADR-001 §5 "Maven / build" + §3, ADR-000 §3 (repo structure)
  and §7 (env vars). Stack: Spring Boot 4.1.x, Java 21 release target, starter `spring-boot-starter-webmvc`.
  Generate the project into `app/backend` (Spring Initializr layout **with `./mvnw` wrapper** since `mvn`
  is not installed). Add deps now: `spring-boot-starter-webmvc`, `spring-boot-starter-validation`,
  `com.openai:openai-java:4.41.x`, `net.coobird:thumbnailator:0.4.x`,
  `com.twelvemonkeys.imageio:imageio-webp:3.13.x` (+ `imageio-core`), `spring-boot-starter-test`, WireMock.
  `application.yml`: `spring.threads.virtual.enabled=true`, multipart `max-file-size=10MB`,
  `max-request-size=12MB`, `server.tomcat.max-http-form-post-size=12MB`. Add `maven-resources-plugin`
  to copy `../../docs/policies/*.md` → `src/main/resources/policies/` at `generate-resources`.
  Create `app/.env` from `.env.example` using the key the orchestrator passes you; ensure root
  `.gitignore` ignores `app/.env` and build output. Update `app/AGENTS.md` with the backend run/test commands.
- **TDD:** (red) a `HealthControllerTest` asserting `GET /api/health` → 200 `{status:"UP"}`; a context-loads test.
- **Verify:** `./mvnw -q test`; `./mvnw spring-boot:run` then health returns UP.
- **Commit:** `Backend: scaffold Spring Boot service, health endpoint, env + policy resource copy`.

### Step 0.2 — Frontend scaffold + NBP theme baseline  · `fe-developer`
- **Depends on:** none.
- **Context brief to agent:** Read ADR-003 §2–3, `docs/design-guidelines.md` (colors §2, typography §3,
  spacing §4, radius §5, buttons/inputs §6), `assets/design-tokens.json`, `assets/fonts/fonts.css`,
  `assets/logo.svg`/`favicon.ico`. Scaffold Angular **20** into `app/frontend` via `npx @angular/cli@20 new`
  (standalone, **zoneless**, routing, SCSS). Add Angular Material 20 (`ng add`), `ngx-markdown` (+`marked`,
  allow `--legacy-peer-deps` if needed), `@microsoft/fetch-event-source`. Wire self-hosted fonts (copy/import
  `fonts.css`), set favicon + logo. Build an Angular Material theme from NBP tokens: primary navy `#152E52`,
  accent gold `#BDAD7D`, link blue `#4A74B0`, surfaces/text/borders per guidelines; serif headings
  (Brygada 1918), Libre Franklin body; radii 2–6px. Create `proxy.conf.json` → `/api` to `http://localhost:8080`
  and wire it into `ng serve`. Create empty `src/app/i18n/pl.ts` constants stub.
- **TDD:** (red) `AppComponent` spec asserting the app renders and the NBP brand title text is present.
- **Verify:** `npx ng test --watch=false --browsers=ChromeHeadless`; `npx ng build`; `npx ng serve` smoke.
- **Commit:** `Frontend: scaffold Angular 20 app + Angular Material NBP theme baseline`.

**Phase 0 exit gate:** both 0.1 and 0.2 committed and verified.

---

## 5. PHASE 1 — Backend (all `be-developer`, sequential within the agent, ordered by dependency)

> Runs in parallel with Phase 2 (different subtree). The LLM is mocked (WireMock/Mockito) in every test here.
> Each step: cite only the listed spec lines; write tests first; commit on green.

| Step | Title | Depends on | Spec to read | First-written tests (TDD) | Commit |
|---|---|---|---|---|---|
| 1.1 | `PolicyLoader` | 0.1 | ADR-001 §3 (PolicyLoader), TAC-001-09 | both policy files load non-empty; missing file → fail-fast at startup | `Backend: policy loader (classpath, fail-fast)` |
| 1.2 | `ImageService` validation | 0.1 | PRD AC-06/07/08; ADR-001 §4 magic bytes, TAC-001-02 | accept real JPEG/PNG/WebP; reject spoofed (png renamed .jpg) via magic bytes; reject zero-byte; reject >10MB | `Backend: image validation (magic-byte + size)` |
| 1.3 | `ImageService` compression | 1.2 | PRD AC-10; ADR-001 §6 compress decision, TAC-001-03, TAC-03 | output is JPEG base64; smaller than >1MB input for JPEG/PNG/WebP; tiny image not upscaled; WebP decodes (TwelveMonkeys) | `Backend: image compression to JPEG base64` |
| 1.4 | `CaseSubmission` + bean validation | 0.1 | PRD AC-01..05/09; ADR-001 §4 rules table | enum binding; `@NotBlank` model; `@PastOrPresent` date; reason required iff COMPLAINT (`@AssertTrue`); messages in Polish | `Backend: case submission model + validation` |
| 1.5 | `AiClientConfig` + model/header config | 0.1 | ADR-002 §3, §6 (slug-as-String, headers), TAC-002-08/09, TAC-11 | outbound `model` == configured env String slug; `ChatModel` enum not used; `HTTP-Referer`/`X-Title` present when set, omitted otherwise | `Backend: OpenAI SDK client config for OpenRouter` |
| 1.6 | `PromptFactory` (4 prompts) | 1.1 | PRD §11.2/11.3; ADR-002 §3 prompts table, TAC-002-01/02, TAC-05/06 | prompt selected by request type (return vs complaint), for analysis and decision; matching policy text injected into decision prompt; guardrail + disclaimer + off-topic clauses present; all Polish | `Backend: prompt factory (4 Polish prompts + policy injection)` |
| 1.7 | `VisionAnalyzer` | 1.5,1.6 | ADR-002 §5 vision, TAC-002-03 | request carries image content part `data:image/jpeg;base64,…` + text part + **vision** slug (WireMock) | `Backend: vision analyzer call` |
| 1.8 | `DecisionEngine` (structured output) | 1.5,1.6 | ADR-002 §4 Decision schema, §6 structured decision, TAC-002-04/05, TAC-04 | structured JSON → `Decision`; exactly one verdict enum; non-empty justification + disclaimer; `NEEDS_REVIEW` has `missingInfo` | `Backend: decision engine (structured output)` |
| 1.9 | `ConversationStore` | 0.1 | ADR-001 §3 store + §state, TAC-001-06/07 | store/retrieve by sessionId; idle-TTL eviction; unknown id → empty/Optional | `Backend: in-memory conversation store + TTL eviction` |
| 1.10 | `DecisionService` orchestration | 1.3,1.7,1.8,1.9 | PRD §4.1/4.2/4.5, AC-26; ADR-001 §3, ADR-000 §9.3 error seq, TAC-01 | happy path: analysis→decision→conversation seeded; **no LLM call on invalid input**; LLM failure → no seed, surfaced error (no fabrication) | `Backend: decision orchestration service` |
| 1.11 | `ChatService` (streaming) | 1.5,1.9 | PRD AC-21/22/23/24/27; ADR-002 §5 streaming, TAC-002-06/07, TAC-08 | forwards deltas in order + completion; **full conversation context** sent each turn; new info incorporated; mid-stream error surfaced, prior messages kept | `Backend: streaming chat service` |
| 1.12 | `CaseController` + `@ControllerAdvice` + CORS | 1.4,1.2,1.10 | PRD AC-09/26; ADR-001 §5 contracts, ADR-000 §6, TAC-001-01/04/08, TAC-10/12 | MockMvc: valid→200 `CaseResponse`; validation→400 Polish `fieldErrors` & **mock LLM never called**; >10MB→400/413 pre-analysis; LLM fail→502/503 retryable; CORS allows configured origin, blocks others | `Backend: /api/cases controller, error advice, CORS` |
| 1.13 | `ChatController` (SSE) | 1.11,1.9 | PRD AC-24; ADR-001 §5 SSE, ADR-000 §6, TAC-001-05, TAC-07/09 | `Content-Type: text/event-stream`; ≥1 `data:` + terminal `complete`; unknown session→404 (not 500); runs on virtual-thread executor | `Backend: /api/chat/stream SSE controller` |
| 1.14 | Backend full verification | 1.12,1.13 | ADR-000 §10, ADR-001 §8 | full suite green; `package` ok; app starts; manual `/api/health` ok | `Backend: full suite green + startup verified` (only if fixes) |

---

## 6. PHASE 2 — Frontend (all `fe-developer`, sequential within the agent)

> Runs in parallel with Phase 1. Services tested with `HttpTestingController` / mocked `fetch` — **no running
> backend required** until E2E. Uses the frozen contract (§3). Big components are split into sub-steps.

| Step | Title | Depends on | Spec to read | First-written tests (TDD) | Commit |
|---|---|---|---|---|---|
| 2.1 | `pl` constants + theme finalize | 0.2 | ADR-003 §3 services; design-guidelines §6; PRD AC-25 | `pl` exposes all required label/error/button keys; theme tokens applied | `Frontend: Polish string constants + theme tokens` |
| 2.2 | Models + `SessionState` | 0.2 | ADR-003 §4 data, §3 state, TAC-003-10 | `RequestType`/`Category`/`Decision`/`CaseResponse` match §3; `SessionState` holds `crypto.randomUUID()` sessionId, summary, messages signals | `Frontend: domain models + session state` |
| 2.3 | `CaseApiService` | 2.2 | ADR-003 §5; §3 contract; PRD AC-26 | multipart POST→`CaseResponse`; maps 400 `fieldErrors` onto form; maps 502/503 to retryable error | `Frontend: case API service` |
| 2.4a | `IntakeForm` structure + validators | 2.1,2.2 | PRD AC-01/02/03/04; ADR-003 §3/§4 | request-type toggle, category select (11 labels), model required, datepicker `[max]=today` blocks future | `Frontend: intake form structure + base validators` |
| 2.4b | Reason required toggle | 2.4a | PRD AC-05; ADR-003 TAC-003-01 | reason required+marker when COMPLAINT, optional when RETURN; switching back clears error | `Frontend: reason required toggle` |
| 2.4c | Image upload (type/size/preview) | 2.4a | PRD AC-06/07/08; ADR-003 TAC-003-03/04 | reject non-JPEG/PNG/WebP & >10MB with Polish format-naming errors; exactly one required; thumbnail preview; remove/replace | `Frontend: image upload + client validation` |
| 2.4d | Submit lock + navigate | 2.4c,2.3 | PRD §9.1 loading/nav; ADR-003 TAC-003-05 | valid submit locks form + in-progress until response; success → set sessionId & navigate to chat; error unlocks | `Frontend: submit lock + navigation` |
| 2.5 | `MessageBubbleComponent` | 2.1 | ADR-003 §3; PRD AC-20 | agent message rendered as Markdown (headings/lists/emphasis); user message plain; visual distinction | `Frontend: message bubble (markdown)` |
| 2.6 | `TypingIndicatorComponent` | 2.1 | ADR-003 §3; PRD AC-24 | 3-dot indicator shows/hides on a streaming flag | `Frontend: typing indicator` |
| 2.7 | `ChatApiService` (SSE) | 2.2 | ADR-003 §5 SSE; §3 contract | SSE-over-POST via fetch-event-source yields tokens; handles `complete`; surfaces `error`; 404 signalled | `Frontend: chat SSE service` |
| 2.8a | `ChatComponent` decision render | 2.5,2.2 | PRD AC-20; ADR-003 TAC-003-06 | first agent bubble shows verdict + justification + nextSteps + disclaimer (Markdown); NEEDS_REVIEW shows missingInfo; read-only case summary panel | `Frontend: chat decision message + summary` |
| 2.8b | Send + streaming render | 2.7,2.6,2.8a | PRD AC-21/24; ADR-003 TAC-003-07 | send appends user msg; assistant bubble grows token-by-token; typing indicator during stream, hidden on complete | `Frontend: chat send + streaming render` |
| 2.8c | Chat error/retry + 404 | 2.8b | PRD AC-26; ADR-003 TAC-003-08 | mid-turn error → inline per-turn retry, prior messages intact; 404 → offer start-new-case | `Frontend: chat error handling + retry` |
| 2.9 | Routing + Polish audit | 2.4d,2.8c | PRD AC-25; ADR-003 TAC-003-09 | form→chat route; "new case" returns to fresh form; assert all visible strings Polish | `Frontend: routing + Polish text audit` |
| 2.10 | Frontend full verification | 2.9 | ADR-003 §8 | full unit suite green; `ng build`; `ng serve` smoke | `Frontend: full suite green + build verified` (only if fixes) |

---

## 7. PHASE 3 — Integration & E2E (`qa-engineer`)

> Spec authoring (3.1) may begin in parallel right after Phase 0 (contract frozen). **Running** E2E
> (3.2) requires Phase 1 **and** Phase 2 complete. Real OpenRouter key, cheap model.

| Step | Title | Depends on | Detail | Commit |
|---|---|---|---|---|
| 3.1 | Playwright project + spec authoring | 0.1,0.2 | Scaffold `app/e2e` Playwright project; write specs against §3 contract: return→Approve, complaint→Reject, ambiguous→Needs review, invalid submission (inline errors, no decision), AI-unavailable (point backend at a bad key/model to force 502/503 → retryable state), chat follow-up reflects context, off-topic decline, Polish text, streaming renders incrementally. Read PRD §4 flows + §6 ACs, ADR-000 §10 scenarios. | `Tests: Playwright E2E specs (PRD flows)` |
| 3.2 | Run E2E on live stack | 1.14,2.10,3.1 | Orchestrator starts backend (`./mvnw spring-boot:run` with `.env`) + frontend (`npx ng serve`); qa runs `npx playwright test`. Failures → orchestrator routes a targeted fix task to the owning dev (be/fe), then qa re-runs. | `Tests: E2E green on live stack` (after fixes land) |
| 3.3 | AC/TAC traceability report | 3.2 | qa produces the §9 matrix confirming each AC/TAC maps to a passing test; lists any gap → orchestrator opens fix steps. | `Docs: AC/TAC traceability report` |

---

## 8. PHASE 4 — Final verification & sign-off (orchestrator-driven)

- 4.1 Full green sweep: backend suite, frontend suite, E2E all pass; both apps start cleanly.
- 4.2 Design conformance: `fe-developer` + `qa-engineer` capture Playwright screenshots of form + chat
  and check against `docs/design-guidelines.md` (navy/gold, fonts, radii, Polish). Fixes → fe.
- 4.3 PoC sign-off summary: what's covered, how to run, known risks. (No remote push unless requested.)

---

## 9. Dependency matrix & parallelization

**Cross-phase gates (hard barriers):**
- Phase 0 → everything. (0.1 ∥ 0.2.)
- Phase 1 ∥ Phase 2 (independent subtrees) after Phase 0.
- 3.1 may start after Phase 0; 3.2 needs 1.14 **and** 2.10.
- Phase 4 after Phase 3.

**Timeline (∥ = concurrent agents):**
```
Phase 0:  [be 0.1]  ∥  [fe 0.2]
            |              |
            v              v
Phase 1/2: [be 1.1→1.14] ∥ [fe 2.1→2.10] ∥ [qa 3.1 spec authoring]
                       \         |         /
                        \        v        /
Phase 3:                 [qa 3.2 run E2E] → [qa 3.3 traceability]
                                  |
Phase 4:               [final sweep + design + sign-off]
```

**Backend internal order (1.x):** leaves `1.1,1.2,1.4,1.5,1.9` first → `1.3`(after 1.2),
`1.6`(after 1.1) → `1.7,1.8`(after 1.5,1.6) → `1.10`(after 1.3,1.7,1.8,1.9), `1.11`(after 1.5,1.9)
→ `1.12`(after 1.4,1.2,1.10), `1.13`(after 1.11,1.9) → `1.14`.

**Frontend internal order (2.x):** `2.1,2.2` → `2.3`(after 2.2), `2.4a`(after 2.1,2.2) →
`2.4b,2.4c`(after 2.4a) → `2.4d`(after 2.4c,2.3); `2.5,2.6`(after 2.1), `2.7`(after 2.2) →
`2.8a`(after 2.5,2.2) → `2.8b`(after 2.7,2.6,2.8a) → `2.8c`(after 2.8b) → `2.9` → `2.10`.

**Conflict-avoidance rules:** (a) each agent stays in its subtree; (b) all shared-file edits
(`.gitignore`, `app/AGENTS.md`, `app/.env`) happen only in Step 0.1; (c) the frozen contract (§3) is
the single source of truth for cross-end shapes — neither dev changes it unilaterally (a change goes
through the orchestrator, which updates both ends in one coordinated step); (d) the orchestrator
serializes the *commit instant* so only one agent commits at a time even when two run concurrently;
(e) agents `git pull --rebase` before committing.

---

## 10. AC / TAC → step traceability (full coverage)

| AC / TAC | Covered by step(s) |
|---|---|
| AC-01..04 (form selectors/inputs/date) | 2.4a · 1.4 |
| AC-05 (reason required iff complaint) | 2.4b · 1.4 |
| AC-06/07/08 (image required/type/size) | 2.4c · 1.2 |
| AC-09 (no LLM until valid) | 1.12 · 1.10 (TAC-01/TAC-001-01) |
| AC-10 (backend compresses) | 1.3 (TAC-02/TAC-001-03) |
| AC-11/12/13 (analysis by type) | 1.6,1.7 (TAC-05/TAC-002-01) |
| AC-14 (3 verdicts) | 1.8 (TAC-04/TAC-002-04) |
| AC-15 (type-specific prompt + matching policy) | 1.6 (TAC-06/TAC-002-02) |
| AC-16 (justification w/ factors) | 1.8 |
| AC-17 (insufficient → Needs review + missing) | 1.8 (TAC-002-05) |
| AC-18 (advisory disclaimer always) | 1.8 (TAC-04) |
| AC-19 (no binding guarantee) | 1.6 (prompt guardrails) |
| AC-20 (first chat msg formatted) | 2.8a (TAC-003-06) |
| AC-21 (follow-up messages) | 2.8b · 1.11 |
| AC-22 (full context each turn) | 1.11 (TAC-08) |
| AC-23 (incorporate new info) | 1.11 |
| AC-24 (in-progress indicator) | 2.6,2.8b (TAC-003-07) |
| AC-25 (all Polish) | 2.1,2.9 · 1.4,1.6 (TAC-003-09) |
| AC-26 (retryable error, no fake decision) | 1.10,1.12 · 2.3,2.8c (TAC-001/TAC-003-08) |
| AC-27 (off-topic decline) | 1.6,1.11 (ADR-002 guardrails) |
| TAC-03/TAC-001-02 (formats decode/spoof reject) | 1.2,1.3 |
| TAC-001-05 / TAC-07 (SSE content-type + complete) | 1.13 |
| TAC-001-06 / TAC-09 (unknown session → 404) | 1.13,1.9 |
| TAC-001-07 (TTL eviction) | 1.9 |
| TAC-001-08 / TAC-10 (CORS) | 1.12 |
| TAC-001-09 (policy fail-fast) | 1.1 |
| TAC-002-06/07 (stream order + mid-stream error) | 1.11 |
| TAC-002-08 / TAC-11 (model String slug, no enum) | 1.5 |
| TAC-002-09 (attribution headers) | 1.5 |
| TAC-12 / TAC-001-04 (>10MB pre-analysis) | 1.2,1.12 |
| TAC-003-01..05,10 (form behaviors) | 2.4a-d,2.2 |
| TAC-003-08 (chat retry/404) | 2.8c |
| E2E full flow | 3.2 |

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `openai/gpt-5.4-mini` may not be vision-capable on OpenRouter | First live check at 3.2; if vision fails, switch `OPENROUTER_VISION_MODEL` to `openai/gpt-5.4` in `.env` (config-only, no code change) |
| Spring Boot 4.1 + OpenAI SDK structured-output API surface differs from tutorials | be-developer fetches current docs via Context7 (`/spring-projects/spring-boot`) and the OpenAI Java SDK GitHub at step 1.5/1.8 |
| ngx-markdown peer-dep conflict on Angular 20 | `--legacy-peer-deps`; documented fallback `marked` + `DomSanitizer` (ADR-003 §6) |
| `mvn`/`ng` not on PATH | Use `./mvnw` and `npx @angular/cli` everywhere (already baked into briefs) |
| Live LLM cost/flakiness in E2E | Cheap model; E2E kept to a minimal scenario set; unit/integration fully mocked |
| Two concurrent agents committing | Orchestrator serializes commit instant + subtree isolation + rebase rule (§9) |

---

## 12. What happens on approval

The orchestrator will, in order: (0) create branch `feat/poc-implementation`; dispatch **0.1 (be) ∥
0.2 (fe)**; gate. Then dispatch **Phase 1 (be) ∥ Phase 2 (fe) ∥ 3.1 (qa spec authoring)**, feeding each
agent only its step's context brief above and continuing the same agent via follow-up messages to
preserve context. Then **3.2 → 3.3 → Phase 4**, routing any failures back to the owning agent. Progress
reported after each step; no remote push unless requested.
```
