import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Chat screen (route: /chat).
 *
 * All selectors confirmed against the live Angular component DOM on 2026-06-25 (Step 3.2).
 *
 * Key findings:
 * - Message bubbles: .message-bubble--assistant / .message-bubble--user
 * - Assistant messages rendered via ngx-markdown inside .message-bubble--assistant
 * - Typing indicator: .typing-indicator with role="status" and aria-label="Asystent pisze…"
 * - "Nowa sprawa" button: "Rozpocznij nową sprawę" (from pl.ts chat.startNewCase)
 * - Chat input: placeholder "Napisz wiadomość…"
 * - Send: icon-button with aria-label "Wyślij wiadomość"
 * - Retry on error: "Spróbuj ponownie" (from pl.ts chat.retryButton)
 *
 * Polish verdict labels (from pl.ts):
 *   APPROVE:       "Pozytywna opinia"
 *   REJECT:        "Negatywna opinia"
 *   NEEDS_REVIEW:  "Wymaga weryfikacji"
 *
 * Disclaimer: LLM-generated text; matched with regex for key words.
 */
export class ChatPage {
  readonly page: Page;

  // The message list container
  readonly conversationArea: Locator;

  // All assistant message bubbles
  readonly messageBubbles: Locator;

  // The first (agent decision) bubble
  readonly firstAgentBubble: Locator;

  // Message input at the bottom
  readonly messageInput: Locator;

  // Send button (icon-button)
  readonly sendButton: Locator;

  // Typing indicator (shown while agent streams)
  readonly typingIndicator: Locator;

  // "Nowa sprawa" (new case) restart button
  readonly nowaSprawaButton: Locator;

  // Per-turn retry button (appears on streaming error)
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Message list container (aria-live="polite")
    this.conversationArea = page.locator('.message-list');

    // All assistant bubbles
    this.messageBubbles = page.locator('.message-bubble--assistant');

    // First agent bubble (decision message)
    this.firstAgentBubble = page.locator('.message-bubble--assistant').first();

    // Chat input — placeholder confirmed
    this.messageInput = page.getByPlaceholder('Napisz wiadomość…');

    // Send button — icon-button with aria-label
    this.sendButton = page.getByRole('button', { name: 'Wyślij wiadomość' });

    // Typing indicator — .typing-indicator with role="status"
    this.typingIndicator = page.locator('.typing-indicator');

    // "Nowa sprawa" button — confirmed Polish label
    this.nowaSprawaButton = page.getByRole('button', { name: 'Rozpocznij nową sprawę' });

    // Retry button on turn error
    this.retryButton = page.getByRole('button', { name: 'Spróbuj ponownie' });
  }

  async waitForDecision() {
    // Wait until we are on the chat route and the first agent bubble is visible
    await expect(this.page).toHaveURL(/\/chat/, { timeout: 30_000 });
    await expect(this.firstAgentBubble).toBeVisible({ timeout: 90_000 }); // LLM can be slow
  }

  async getFirstBubbleText(): Promise<string> {
    return (await this.firstAgentBubble.textContent()) ?? '';
  }

  /**
   * Asserts the first agent bubble contains one of the three Polish verdict labels.
   * Polish verdict labels (from pl.ts): "Pozytywna opinia" | "Negatywna opinia" | "Wymaga weryfikacji"
   */
  async expectVerdictLabel(): Promise<void> {
    await expect(this.firstAgentBubble).toContainText(
      /Pozytywna opinia|Negatywna opinia|Wymaga weryfikacji/,
      { timeout: 90_000 }
    );
  }

  /**
   * Asserts the first agent bubble contains a specific Polish verdict label.
   */
  async expectVerdictInFirstBubble(verdict: 'Approve' | 'Reject' | 'Needs review') {
    // Confirmed Polish verdict labels from pl.ts
    const verdictPatterns: Record<string, RegExp> = {
      Approve:        /Pozytywna opinia/i,
      Reject:         /Negatywna opinia/i,
      'Needs review': /Wymaga weryfikacji/i,
    };
    await expect(this.firstAgentBubble).toContainText(verdictPatterns[verdict], { timeout: 90_000 });
  }

  async expectDisclaimerInFirstBubble() {
    // PRD §11.5 — advisory disclaimer must always be present.
    // The LLM generates the disclaimer text; match on common Polish advisory keywords.
    await expect(this.firstAgentBubble).toContainText(
      /zalecenie|rekomendacja|nie jest ostateczn|decyzja.*pracownik|informacja.*orientacyjn|porada.*wst[ęe]pn/i,
      { timeout: 90_000 }
    );
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async waitForTypingIndicatorGone() {
    // The typing indicator is present while streaming; wait for it to disappear
    // It may not appear if the response is very fast, so use a relaxed timeout
    await expect(this.typingIndicator).toBeHidden({ timeout: 90_000 });
  }

  async getLastAgentBubbleText(): Promise<string> {
    const bubbles = this.page.locator('.message-bubble--assistant');
    const count = await bubbles.count();
    if (count === 0) return '';
    return (await bubbles.nth(count - 1).textContent()) ?? '';
  }

  async waitForNewAgentBubble(previousCount: number): Promise<void> {
    // Wait until there is at least one more assistant bubble than before sending
    await expect(this.page.locator('.message-bubble--assistant')).toHaveCount(
      previousCount + 1,
      { timeout: 90_000 }
    );
    // Then wait for the typing indicator to disappear (streaming done)
    await this.waitForTypingIndicatorGone();
  }

  async clickNowaSprawaMi() {
    await this.nowaSprawaButton.click();
    await expect(this.page).toHaveURL('/'); // should navigate back to intake form
  }
}
