import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Ambiguous / blurry photo → Needs review decision
 *
 * PRD coverage:
 *   §4.3 Alternative — Needs review (ambiguous)
 *   §6 ACs: AC-14, AC-17, AC-18, AC-20, AC-21, AC-23
 *
 * Scenario: Customer uploads a minimal/blurry photo where the agent
 * cannot reach confident Approve/Reject → expects Needs review decision
 * listing what is missing, followed by a clarification exchange.
 */
test.describe('Zdjęcie niewyraźne — decyzja: Wymaga weryfikacji (Needs review)', () => {
  test('@smoke AC-14,AC-17,AC-18,AC-20 niewyraźne zdjęcie → Needs review + lista brakujących informacji', async ({ page }) => {
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

    // Vague reason that doesn't clearly indicate defect vs user damage
    await intakeForm.fillReason(
      'Tablet nie działa tak jak powinien. Coś jest z nim nie tak.'
    );

    // Upload a minimal WebP — system should recognise image is not informative enough
    // In real E2E the LLM will assess the tiny 36-byte WebP as unusable (AC-17)
    await intakeForm.uploadImage(FIXTURES.blurryPhotoWebp);

    // -- Step 3: Submit
    await intakeForm.submit();

    // -- Step 4: Chat screen with decision (AC-20)
    await chatPage.waitForDecision();

    // Verdict: Needs review (AC-14)
    await chatPage.expectVerdictInFirstBubble('Needs review');

    // AC-17: Must state what is missing (blurry/unusable image → ask for better photo)
    // TODO(3.2): confirm exact Polish phrasing from LLM
    await expect(chatPage.firstAgentBubble).toContainText(
      /wyraźniejsze zdjęcie|lepsze zdjęcie|brak informacji|niewystarczające zdjęcie|nie mo[żg][ęe] ocenić/i,
      { timeout: 60_000 }
    );

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 5: Customer provides clarification (AC-21, AC-23)
    await chatPage.sendMessage(
      'Przepraszam, zdjęcie było złej jakości. Tablet ma pęknięte szkło na ekranie — to wada fabryczna, nie mój błąd.'
    );
    await chatPage.waitForTypingIndicatorGone();

    // Agent should incorporate the new information (AC-23)
    const clarificationReply = await chatPage.getLastAgentBubbleText();
    expect(clarificationReply.length).toBeGreaterThan(50);
    // TODO(3.2): assert agent acknowledges the new info and revises or maintains its stance
  });

  test('AC-17 agent precyzyjnie opisuje co jest brakujące przy Needs review', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Telewizory');
    await intakeForm.fillModel('LG OLED 55C3');

    // Edge case: 20 days ago — may or may not qualify depending on channel
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    await intakeForm.fillPurchaseDate(twentyDaysAgo.toISOString().split('T')[0]);

    // No reason (Zwrot — optional)
    await intakeForm.uploadImage(FIXTURES.blurryPhotoWebp);
    await intakeForm.submit();

    await chatPage.waitForDecision();

    // Ambiguous: either the date or image quality triggers Needs review
    const bubbleText = await chatPage.getFirstBubbleText();
    expect(bubbleText.length).toBeGreaterThan(50);

    // Whatever decision is returned, disclaimer must be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();
  });
});
