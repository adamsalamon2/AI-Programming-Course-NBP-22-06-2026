import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Ambiguous / blurry photo — structural LLM decision assertions
 *
 * PRD coverage:
 *   §4.3 Alternative — Needs review (ambiguous)
 *   §6 ACs: AC-14, AC-17, AC-18, AC-20, AC-21, AC-23
 *
 * Scenario: Customer uploads a minimal/blurry WebP — app navigates to /chat,
 * first agent bubble renders one of the three Polish verdict labels plus a
 * non-empty justification and advisory disclaimer.
 *
 * NOTE (Step 3.2): The fixture is a tiny synthetic WebP (blurry-photo.webp, ~36 bytes).
 * A real vision model may or may not return "Wymaga weryfikacji" from it — we assert
 * STRUCTURE (any valid verdict label + justification + disclaimer) rather than
 * hard-coding "Wymaga weryfikacji".
 * Follow-up chat turn must stream a non-empty reply (AC-21, AC-23).
 */
test.describe('Zdjęcie niewyraźne — nawigacja do chatu + struktura odpowiedzi', () => {
  test('@smoke AC-14,AC-17,AC-18,AC-20 niewyraźne zdjęcie → chat + decyzja + zastrzeżenie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    // -- Step 1: Navigate to the intake form
    await intakeForm.goto();

    // -- Step 2: Reklamacja with ambiguous/blurry photo
    await intakeForm.selectRequestType('Reklamacja');
    await intakeForm.selectCategory('Tablety');
    await intakeForm.fillModel('iPad Air 5');

    // Recent purchase (within warranty)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    await intakeForm.fillPurchaseDate(twoMonthsAgo.toISOString().split('T')[0]);

    // Vague reason
    await intakeForm.fillReason(
      'Tablet nie działa tak jak powinien. Coś jest z nim nie tak.'
    );

    // Upload a minimal WebP
    await intakeForm.uploadImage(FIXTURES.blurryPhotoWebp);

    // -- Step 3: Submit
    await intakeForm.submit();

    // -- Step 4: Chat screen with decision (AC-20)
    await chatPage.waitForDecision();

    // Verdict must be one of the three Polish labels (AC-14)
    await chatPage.expectVerdictLabel();

    // First bubble must be substantive (AC-17: states what is missing or why)
    const firstBubble = await chatPage.getFirstBubbleText();
    expect(firstBubble.length).toBeGreaterThan(50);

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 5: Customer provides clarification (AC-21, AC-23)
    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage(
      'Przepraszam, zdjęcie było złej jakości. Tablet ma pęknięte szkło na ekranie — to wada fabryczna, nie mój błąd.'
    );
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    // Agent should incorporate the new information (AC-23) — reply is non-empty
    const clarificationReply = await chatPage.getLastAgentBubbleText();
    expect(clarificationReply.length).toBeGreaterThan(50);
  });

  test('AC-17 agent zwraca decyzję i zastrzeżenie dla zwrotu z blurry photo', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Telewizory');
    await intakeForm.fillModel('LG OLED 55C3');

    // Edge case: 20 days ago
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    await intakeForm.fillPurchaseDate(twentyDaysAgo.toISOString().split('T')[0]);

    // No reason (Zwrot — optional)
    await intakeForm.uploadImage(FIXTURES.blurryPhotoWebp);
    await intakeForm.submit();

    await chatPage.waitForDecision();

    // Any valid verdict + disclaimer
    await chatPage.expectVerdictLabel();
    const bubbleText = await chatPage.getFirstBubbleText();
    expect(bubbleText.length).toBeGreaterThan(50);
    await chatPage.expectDisclaimerInFirstBubble();
  });
});
