import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the Chat screen (route: /chat).
 *
 * All Polish text expectations are frozen from PRD §9.2, §11.4–11.5.
 * Selectors marked // TODO(3.2): confirm selector must be verified
 * against the live Angular component tree before Step 3.2 runs.
 */
export class ChatPage {
  readonly page: Page;

  // The entire conversation container
  // TODO(3.2): confirm selector — may be a section/article or custom component
  readonly conversationArea: Locator;

  // All message bubbles
  // TODO(3.2): confirm selector — Angular Material may use custom classes
  readonly messageBubbles: Locator;

  // The first (agent decision) bubble
  // TODO(3.2): confirm — first [role="listitem"] or first .message-bubble
  readonly firstAgentBubble: Locator;

  // Message input at the bottom
  // TODO(3.2): confirm label — Polish placeholder or label expected
  readonly messageInput: Locator;

  // Send button
  // TODO(3.2): confirm Polish label or icon-button aria-label
  readonly sendButton: Locator;

  // Typing indicator (shown while agent streams)
  // TODO(3.2): confirm selector — TypingIndicatorComponent; may be [role="status"] or CSS animation
  readonly typingIndicator: Locator;

  // "Nowa sprawa" (new case) restart button
  // TODO(3.2): confirm Polish label
  readonly nowaSprawaButton: Locator;

  // Per-turn retry button (appears on streaming error)
  // TODO(3.2): confirm Polish label — "Spróbuj ponownie" or similar
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.conversationArea = page.locator('[role="log"], .conversation, app-chat').first(); // TODO(3.2): confirm selector
    this.messageBubbles = page.locator('.message-bubble, [data-role="message"]'); // TODO(3.2): confirm selector
    this.firstAgentBubble = page.locator('.message-bubble.agent, [data-role="assistant"]').first(); // TODO(3.2): confirm selector

    this.messageInput = page.getByLabel(/wiadomo[sś][cć]|pytanie|twoja wiadomo[sś][cć]/i) // TODO(3.2): confirm label
      .or(page.getByPlaceholder(/wpisz wiadomo[sś][cć]/i));

    this.sendButton = page.getByRole('button', { name: /wy[sś]lij|send/i }); // TODO(3.2): confirm label or icon-button

    this.typingIndicator = page.locator('.typing-indicator, [aria-label*="pisze"], [role="status"]').first(); // TODO(3.2): confirm selector

    this.nowaSprawaButton = page.getByRole('button', { name: /nowa sprawa/i }); // TODO(3.2): confirm Polish label
    this.retryButton = page.getByRole('button', { name: /spr[oó]buj ponownie/i }); // TODO(3.2): confirm Polish label
  }

  async waitForDecision() {
    // Wait until we are on the chat route and the first agent bubble is visible
    await expect(this.page).toHaveURL(/\/chat/);
    await expect(this.firstAgentBubble).toBeVisible({ timeout: 60_000 }); // LLM can be slow
  }

  async getFirstBubbleText(): Promise<string> {
    return (await this.firstAgentBubble.textContent()) ?? '';
  }

  async expectVerdictInFirstBubble(verdict: 'Approve' | 'Reject' | 'Needs review') {
    // The Polish decision label — check PRD §11.4 Polish wording
    // TODO(3.2): confirm exact Polish verdict labels from the Angular component
    const verdictPatterns: Record<string, RegExp> = {
      Approve:       /zatwierdz|pozytywn|zaakceptowan/i,
      Reject:        /odrzucon|negatywn|odrzucam/i,
      'Needs review': /wymaga weryfikacji|do sprawdzenia|potrzebna weryfikacja/i,
    };
    await expect(this.firstAgentBubble).toContainText(verdictPatterns[verdict], { timeout: 60_000 });
  }

  async expectDisclaimerInFirstBubble() {
    // PRD §11.5 — advisory disclaimer must always be present
    // TODO(3.2): confirm exact Polish disclaimer text from the agent
    await expect(this.firstAgentBubble).toContainText(
      /zalecenie|rekomendacja|nie jest ostateczn|decyzja.*pracownik/i,
      { timeout: 60_000 }
    );
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async waitForTypingIndicatorGone() {
    // Wait for indicator to appear and then disappear (agent is done streaming)
    await expect(this.typingIndicator).toBeHidden({ timeout: 60_000 });
  }

  async getLastAgentBubbleText(): Promise<string> {
    const bubbles = this.page.locator('.message-bubble.agent, [data-role="assistant"]'); // TODO(3.2): confirm selector
    const count = await bubbles.count();
    if (count === 0) return '';
    return (await bubbles.nth(count - 1).textContent()) ?? '';
  }

  async clickNowaSprawaMi() {
    await this.nowaSprawaButton.click();
    await expect(this.page).toHaveURL('/'); // should navigate back to intake form
  }
}
