import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Complaint (Reklamacja) — structural LLM decision assertions
 *
 * PRD coverage:
 *   §4.2 Happy path — Complaint, Reject
 *   §6 ACs: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-12, AC-14, AC-16, AC-18, AC-20, AC-21
 *
 * Scenario: Customer submits a Reklamacja with a cracked-screen photo and
 * a filled reason → app navigates to /chat, first agent bubble renders
 * one of the three Polish verdict labels plus a non-empty justification and
 * advisory disclaimer.
 *
 * NOTE (Step 3.2): The fixture is a tiny synthetic PNG (cracked-screen.png, ~152 bytes).
 * A real vision model cannot reliably derive "Negatywna opinia" from it, so we
 * assert STRUCTURE rather than a hard-coded verdict.
 * The second test (brak powodu) is a deterministic client-side validation test.
 */
test.describe('Reklamacja — nawigacja do chatu + struktura odpowiedzi', () => {
  test('@smoke AC-05,AC-14,AC-16,AC-18,AC-20 formularz reklamacji → chat + decyzja + zastrzeżenie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    // -- Step 1: Navigate to the intake form
    await intakeForm.goto();

    // -- Step 2: Select "Reklamacja" (Complaint) request type (AC-01)
    await intakeForm.selectRequestType('Reklamacja');

    // -- Step 3: Fill form fields
    await intakeForm.selectCategory('Smartfony'); // AC-02
    await intakeForm.fillModel('iPhone 15 Pro'); // AC-03

    // Purchase date: 8 months ago — within 2-year warranty window (AC-04)
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
    const dateStr = eightMonthsAgo.toISOString().split('T')[0];
    await intakeForm.fillPurchaseDate(dateStr);

    // Reason is required for Reklamacja (AC-05)
    await intakeForm.fillReason(
      'Telefon upadł ze stołu z wysokości ok. 60 cm. Po upadku ekran jest pęknięty i nieużywalny.'
    );

    // -- Step 4: Upload cracked screen photo (AC-06, AC-12)
    await intakeForm.uploadImage(FIXTURES.crackedScreenPng);

    // -- Step 5: Submit and wait for decision
    await intakeForm.submit();

    // -- Step 6: Chat screen with decision (AC-20)
    await chatPage.waitForDecision();

    // Verdict must be one of the three Polish labels (AC-14)
    await chatPage.expectVerdictLabel();

    // First bubble must be substantive (non-empty justification, AC-16)
    const firstBubble = await chatPage.getFirstBubbleText();
    expect(firstBubble.length).toBeGreaterThan(50);

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 7: Follow-up question (AC-21)
    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage('Ile może kosztować taka odpłatna naprawa ekranu?');
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    const followUp = await chatPage.getLastAgentBubbleText();
    expect(followUp.length).toBeGreaterThan(20);
  });

  test('AC-05 brak powodu w Reklamacji blokuje wysłanie formularza', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Reklamacja');
    await intakeForm.selectCategory('Laptopy');
    await intakeForm.fillModel('Lenovo ThinkPad X1');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await intakeForm.fillPurchaseDate(threeMonthsAgo.toISOString().split('T')[0]);

    // Intentionally leave reason empty (should be required for Reklamacja)
    await intakeForm.uploadImage(FIXTURES.crackedScreenPng);
    await intakeForm.submit();

    // Should show inline error for empty reason (AC-05)
    // Confirmed from pl.ts errors.reasonRequired: "Opis powodu reklamacji jest wymagany."
    await intakeForm.expectErrorVisible(/opis powodu reklamacji jest wymagany/i);
    await intakeForm.expectNoNavigation();
  });
});
