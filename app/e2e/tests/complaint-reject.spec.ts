import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Complaint (Reklamacja) — cracked screen → Reject decision
 *
 * PRD coverage:
 *   §4.2 Happy path — Complaint, Reject
 *   §6 ACs: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-12, AC-14, AC-16, AC-18, AC-20, AC-21
 *
 * Scenario: Customer submits a Reklamacja with a cracked-screen photo and
 * a filled reason → expects a Reject decision (mechanical damage not covered
 * by warranty) with alternative (paid repair) + advisory disclaimer.
 */
test.describe('Reklamacja — decyzja: Odrzucono (Reject)', () => {
  test('@smoke AC-05,AC-14,AC-16,AC-18,AC-20 formularz reklamacji (pęknięty ekran) → decyzja Reject + zastrzeżenie', async ({ page }) => {
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

    // Verdict: Reject (AC-14 — mechanical/user-inflicted damage)
    await chatPage.expectVerdictInFirstBubble('Reject');

    // Justification must reference the disqualifying factor (AC-16)
    // Expected keywords: mechanical damage, user-inflicted, not covered
    // TODO(3.2): confirm exact Polish wording from LLM
    await expect(chatPage.firstAgentBubble).toContainText(
      /uszkodzenie mechaniczne|uszkodzenie przez użytkownika|nie obejmuje|nie jest obj[ęe]ta gwarancją/i,
      { timeout: 60_000 }
    );

    // Alternative should be mentioned (paid repair) per PRD §4.2 step 5
    // TODO(3.2): confirm Polish phrasing for paid repair suggestion
    await expect(chatPage.firstAgentBubble).toContainText(
      /naprawa odpłatna|serwis|koszt naprawy|płatna naprawa/i,
      { timeout: 60_000 }
    );

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 7: Follow-up question (AC-21)
    await chatPage.sendMessage('Ile może kosztować taka odpłatna naprawa ekranu?');
    await chatPage.waitForTypingIndicatorGone();

    const followUp = await chatPage.getLastAgentBubbleText();
    expect(followUp.length).toBeGreaterThan(20);
    // TODO(3.2): assert agent replies in context of paid repair without fabricating prices
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
    await intakeForm.expectErrorVisible(/wymagany|pole wymagane|uzupełnij/i); // TODO(3.2): confirm Polish error text
    await intakeForm.expectNoNavigation();
  });
});
