import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Return (Zwrot) — happy path → structural LLM decision assertions
 *
 * PRD coverage:
 *   §4.1 Happy path — Return, Approve
 *   §6 ACs: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-14, AC-16, AC-18, AC-20, AC-21, AC-22, AC-23, AC-24
 *
 * Scenario: Customer submits a Zwrot request within the 14-day window,
 * uploads a minimal JPEG → app navigates to /chat, first agent bubble renders
 * one of the three Polish verdict labels plus a non-empty justification and
 * advisory disclaimer. Follow-up chat message streams a non-empty reply.
 *
 * NOTE (Step 3.2): The fixture is a tiny synthetic JPEG (152 bytes).
 * A real vision model cannot derive a specific verdict from it, so we
 * assert STRUCTURE (verdict is one of three labels + justification + disclaimer)
 * rather than a hard-coded "Pozytywna opinia".
 */
test.describe('Zwrot — decyzja: nawigacja do chatu + struktura odpowiedzi', () => {
  test('@smoke AC-01,AC-05,AC-14,AC-18,AC-20 formularz zwrotu → chat + decyzja + zastrzeżenie', async ({ page }) => {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    // -- Step 1: Navigate to the intake form
    await intakeForm.goto();

    // -- Step 2: Select "Zwrot" (Return) request type (AC-01)
    await intakeForm.selectRequestType('Zwrot');

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
    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);

    // -- Step 5: Submit and wait for chat with decision
    await intakeForm.submit();

    // -- Step 6: Assert chat screen and decision structure (AC-14, AC-18, AC-20)
    await chatPage.waitForDecision();

    // Verdict must be one of the three Polish labels (AC-14)
    await chatPage.expectVerdictLabel();

    // First bubble must be non-empty (substantive response, AC-16)
    const firstBubble = await chatPage.getFirstBubbleText();
    expect(firstBubble.length).toBeGreaterThan(50);

    // Advisory disclaimer must always be present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();

    // -- Step 7: Follow-up question (AC-21, AC-22, AC-23)
    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage('Jak mam spakować produkt do odesłania?');

    // Wait for new agent bubble (typing indicator appears then disappears) (AC-24)
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    // The reply should be non-empty (AC-21)
    const followUpReply = await chatPage.getLastAgentBubbleText();
    expect(followUpReply.length).toBeGreaterThan(20);
  });

  test('AC-04 data zakupu z dokładnie 14 dni temu → chat + zastrzeżenie', async ({ page }) => {
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

    // Any valid verdict label must appear
    await chatPage.expectVerdictLabel();

    // First bubble must be substantive
    const bubbleText = await chatPage.getFirstBubbleText();
    expect(bubbleText.length).toBeGreaterThan(50);

    // Disclaimer always present (AC-18)
    await chatPage.expectDisclaimerInFirstBubble();
  });
});
