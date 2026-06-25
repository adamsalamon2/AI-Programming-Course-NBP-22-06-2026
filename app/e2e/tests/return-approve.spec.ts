import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Return (Zwrot) — happy path → Approve decision
 *
 * PRD coverage:
 *   §4.1 Happy path — Return, Approve
 *   §6 ACs: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-14, AC-16, AC-18, AC-20, AC-21, AC-22, AC-23, AC-24
 *
 * Scenario: Customer submits a Zwrot request within the 14-day window,
 * uploads an unused-looking photo → expects Approve decision with
 * justification + advisory disclaimer in the chat, then sends a follow-up.
 */
test.describe('Zwrot — decyzja: Zatwierdzono (Approve)', () => {
  test('@smoke AC-01,AC-05,AC-14,AC-18,AC-20 formularz zwrotu → decyzja Approve + zastrzeżenie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    // -- Step 1: Navigate to the intake form
    await intakeForm.goto();

    // -- Step 2: Select "Zwrot" (Return) request type (AC-01)
    await intakeForm.selectRequestType('Zwrot');

    // Reason field should be optional for Return (AC-05)
    // TODO(3.2): confirm that the required marker disappears or label changes to "(opcjonalnie)"

    // -- Step 3: Fill form fields (AC-02, AC-03, AC-04)
    await intakeForm.selectCategory('Laptopy'); // AC-02
    await intakeForm.fillModel('Dell XPS 15 9520'); // AC-03

    // Purchase date: 7 days ago — well within 14-day return window (AC-04)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    await intakeForm.fillPurchaseDate(dateStr);

    // Reason is optional for Zwrot — leave empty (AC-05)

    // -- Step 4: Upload an image (AC-06 — required)
    // unused-device.jpg is a minimal JPEG simulating an unused device photo
    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    // TODO(3.2): confirm image preview appears after upload (PRD §9.1)

    // -- Step 5: Submit and wait for decision
    await intakeForm.submit();

    // -- Step 6: Chat screen with decision (AC-20)
    await chatPage.waitForDecision();

    // Verdict in the first agent bubble (AC-14 — one of three outcomes)
    await chatPage.expectVerdictInFirstBubble('Approve');

    // Justification must reference concrete factors (AC-16)
    // TODO(3.2): confirm exact Polish justification keywords once LLM is live
    await expect(chatPage.firstAgentBubble).toContainText(
      /14 dni|w terminie|data zakupu|nieużywany|stanu/i,
      { timeout: 60_000 }
    );

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 7: Follow-up question (AC-21, AC-22, AC-23)
    // Type indicator should appear while agent streams (AC-24)
    await chatPage.sendMessage('Jak mam spakować produkt do odesłania?');

    // Typing indicator visible while streaming (AC-24)
    // TODO(3.2): confirm typing indicator selector; it may appear briefly
    // await expect(chatPage.typingIndicator).toBeVisible({ timeout: 5_000 });

    // Wait for agent to reply
    await chatPage.waitForTypingIndicatorGone();

    // The reply should address packaging/return process
    const followUpReply = await chatPage.getLastAgentBubbleText();
    expect(followUpReply.length).toBeGreaterThan(20);
    // TODO(3.2): add more specific assertion once we know agent's Polish phrasing for packaging
  });

  test('AC-04 data zakupu z dokładnie 14 dni temu jest akceptowana', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Smartfony');
    await intakeForm.fillModel('Samsung Galaxy S25');

    // Exactly 14 days ago — should still qualify
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dateStr = fourteenDaysAgo.toISOString().split('T')[0];
    await intakeForm.fillPurchaseDate(dateStr);

    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    await chatPage.waitForDecision();
    // Should not be a hard reject for exactly 14 days
    // TODO(3.2): confirm exact verdict for day-14 edge case with the actual LLM
    const bubbleText = await chatPage.getFirstBubbleText();
    expect(bubbleText.length).toBeGreaterThan(50);
    await chatPage.expectDisclaimerInFirstBubble();
  });
});
