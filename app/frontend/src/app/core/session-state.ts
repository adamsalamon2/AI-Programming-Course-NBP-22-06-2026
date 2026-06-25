import { Injectable, signal } from '@angular/core';
import type { CaseSummary, ChatMessageVM, Decision } from './models';

/**
 * SessionState — cross-screen application state backed by Angular signals.
 * Holds sessionId (client UUID), caseSummary, messages, and current decision.
 * No persistence: refresh starts a new case.
 */
@Injectable({ providedIn: 'root' })
export class SessionState {
  /** Client-generated UUID, null until first submit */
  private readonly _sessionId = signal<string | null>(null);
  /** Summary of the submitted case */
  private readonly _caseSummary = signal<CaseSummary | null>(null);
  /** Full chat message list */
  private readonly _messages = signal<ChatMessageVM[]>([]);
  /** Most recent decision */
  private readonly _decision = signal<Decision | null>(null);

  /** Read-only session id signal */
  readonly sessionId = this._sessionId.asReadonly();
  /** Read-only case summary signal */
  readonly caseSummary = this._caseSummary.asReadonly();
  /** Read-only message list signal */
  readonly messages = this._messages.asReadonly();
  /** Read-only decision signal */
  readonly decision = this._decision.asReadonly();

  /** Generate and store a new UUID session id */
  initSession(): void {
    this._sessionId.set(crypto.randomUUID());
  }

  /** Store the case summary returned by the backend */
  setCaseSummary(summary: CaseSummary): void {
    this._caseSummary.set(summary);
  }

  /** Store the decision returned by the backend */
  storeDecision(decision: Decision): void {
    this._decision.set(decision);
  }

  /** Append a new message to the list */
  addMessage(msg: ChatMessageVM): void {
    this._messages.update((msgs) => [...msgs, { ...msg }]);
  }

  /**
   * Append a token to the last assistant message.
   * Used during SSE streaming to update the message in place.
   */
  appendTokenToLastMessage(token: string): void {
    this._messages.update((msgs) => {
      if (msgs.length === 0) return msgs;
      const last = msgs[msgs.length - 1];
      if (last.role !== 'assistant') return msgs;
      const updated: ChatMessageVM = { ...last, content: last.content + token };
      return [...msgs.slice(0, -1), updated];
    });
  }

  /** Mark the last assistant message as no longer streaming */
  finalizeLastMessage(): void {
    this._messages.update((msgs) => {
      if (msgs.length === 0) return msgs;
      const last = msgs[msgs.length - 1];
      const updated: ChatMessageVM = { ...last, streaming: false };
      return [...msgs.slice(0, -1), updated];
    });
  }

  /** Remove the last message (used to drop an empty streaming bubble on error) */
  removeLastMessage(): void {
    this._messages.update((msgs) => msgs.slice(0, -1));
  }

  /** Reset all state — used when starting a new case */
  reset(): void {
    this._sessionId.set(null);
    this._caseSummary.set(null);
    this._messages.set([]);
    this._decision.set(null);
  }
}
