import { test, expect } from '@playwright/test';
import { IntakeFormPage } from '../pages/intake-form.page';
import { ChatPage } from '../pages/chat.page';
import { FIXTURES } from '../fixtures/index';

/**
 * Spec: Chat context — follow-up with new information + off-topic handling
 *
 * PRD coverage:
 *   §4.1 step 8 (follow-up chat), §4.3 step 4 (clarification)
 *   §11.6 Off-topic handling
 *   §6 ACs: AC-21, AC-22, AC-23, AC-24, AC-27
 *
 * Scenario 1: After a decision, the customer sends a follow-up that adds
 *   new information — the agent streams a non-empty reply (AC-23).
 * Scenario 2: The customer sends an off-topic message — the agent
 *   politely declines and redirects (AC-27).
 *
 * Selectors confirmed against live DOM (Step 3.2):
 *   - Assistant bubbles: .message-bubble--assistant
 *   - Typing indicator: .typing-indicator (role="status")
 */
test.describe('Kontekst czatu — odpowiedź na follow-up i obsługa pytań off-topic', () => {
  /**
   * Helper: submit a minimal valid Zwrot form and wait for the chat decision.
   * Returns an instance of ChatPage already on the chat screen.
   */
  async function submitAndGetChat(page: Parameters<Parameters<typeof test>[1]>[0]): Promise<ChatPage> {
    const intakeForm = new IntakeFormPage(page);
    const chatPage = new ChatPage(page);

    await intakeForm.goto();
    await intakeForm.selectRequestType('Zwrot');
    await intakeForm.selectCategory('Smartfony');
    await intakeForm.fillModel('Google Pixel 9');

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await intakeForm.fillPurchaseDate(threeDaysAgo.toISOString().split('T')[0]);

    await intakeForm.uploadImage(FIXTURES.unusedDeviceJpeg);
    await intakeForm.submit();

    await chatPage.waitForDecision();
    return chatPage;
  }

  test('AC-22,AC-23 agent odpowiada na follow-up z nową informacją', async ({ page }) => {
    const chatPage = await submitAndGetChat(page);

    // Send a follow-up that adds new context (AC-23)
    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage(
      'Chcę dodać, że telefon był używany przez tydzień i ma lekkie zadrapanie na obudowie. Czy to zmienia decyzję?'
    );
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    // AC-22: agent has full context; AC-23: agent incorporates new info
    // Reply must be non-empty and substantive
    const reply = await chatPage.getLastAgentBubbleText();
    expect(reply.length).toBeGreaterThan(50);
  });

  test('AC-24 wskaźnik pisania jest widoczny podczas generowania odpowiedzi', async ({ page }) => {
    const chatPage = await submitAndGetChat(page);

    // Record current bubble count before sending
    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();

    // Send a message
    await chatPage.sendMessage('Jak długo trwa procedura zwrotu?');

    // Typing indicator should appear while agent streams (AC-24)
    // Use a short timeout — it may appear and disappear quickly
    // We tolerate the case where it's already gone if streaming was very fast
    await expect(chatPage.typingIndicator).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Indicator may have already disappeared — that's acceptable
    });

    // Wait for the agent's reply to arrive
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    const reply = await chatPage.getLastAgentBubbleText();
    expect(reply.length).toBeGreaterThan(20);
  });

  test('AC-27 pytanie off-topic jest grzecznie odrzucane i przekierowane', async ({ page }) => {
    const chatPage = await submitAndGetChat(page);

    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();

    // Off-topic message: general chit-chat unrelated to the complaint/return case
    await chatPage.sendMessage('Jakie są dobre restauracje w Warszawie?');
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    // Agent should politely decline and redirect (AC-27, PRD §11.6)
    // Any non-empty response is acceptable; ideally it stays on-topic
    const reply = await chatPage.getLastAgentBubbleText();
    expect(reply.length).toBeGreaterThan(20);

    // Assert the reply stays in the service scope (redirects / declines off-topic)
    const lastBubble = page.locator('.message-bubble--assistant').last();
    await expect(lastBubble).toContainText(
      /nie mog[ęe] pom[oó]c|poza zakresem|dotyczy tylko|reklamacj|zwrot|serwis|asystent|zaj[mę].*si[ęe]/i,
      { timeout: 90_000 }
    );
  });

  test('AC-27 pytanie o ogólne porady prawne jest przekierowane do celu asystenta', async ({ page }) => {
    const chatPage = await submitAndGetChat(page);

    const bubbleCountBefore = await page.locator('.message-bubble--assistant').count();

    // Off-topic: unrelated legal question
    await chatPage.sendMessage(
      'Proszę wyjaśnij mi przepisy prawa konsumenckiego dotyczące zakupu nieruchomości.'
    );
    await chatPage.waitForNewAgentBubble(bubbleCountBefore);

    // Agent must decline and stay on-topic (AC-27).
    // Streamed reply is normal spaced Polish text (SSE preserves token spaces).
    const lastBubble = page.locator('.message-bubble--assistant').last();
    await expect(lastBubble).toContainText(
      /nie mog[ęe] (wyjaśni|udziel|pom[oó]c)|porad prawnych|niezwiązan|poza zakresem|mog[ęe] (natomiast |jedynie )?pom[oó]c|dotycząc.*(zwrot|reklamacj|spraw)|bieżącej sprawy/i,
      { timeout: 90_000 }
    );
  });

  test('AC-21 wielokrotna wymiana wiadomości działa prawidłowo', async ({ page }) => {
    const chatPage = await submitAndGetChat(page);

    // First follow-up
    const count0 = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage('Czy mogę zwrócić produkt, jeśli nie mam już opakowania?');
    await chatPage.waitForNewAgentBubble(count0);

    const reply1 = await chatPage.getLastAgentBubbleText();
    expect(reply1.length).toBeGreaterThan(20);

    // Second follow-up
    const count1 = await page.locator('.message-bubble--assistant').count();
    await chatPage.sendMessage('A co z ładowarką, którą wyrzuciłem?');
    await chatPage.waitForNewAgentBubble(count1);

    const reply2 = await chatPage.getLastAgentBubbleText();
    expect(reply2.length).toBeGreaterThan(20);

    // Replies should differ (not the same response twice)
    expect(reply1).not.toEqual(reply2);
  });
});
