import { Injectable } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (message: string) => void;
  /** Called when the backend returns 404 (unknown session) */
  onNotFound: () => void;
}

/** Internal event shape for test injection */
export interface TestEvent {
  type: 'message' | 'complete' | 'error';
  data: string;
}

/**
 * ChatApiService — streams chat responses via SSE over POST.
 *
 * Uses @microsoft/fetch-event-source so we can send a body + Accept header,
 * which native EventSource cannot do (GET-only).
 *
 * Unit tests call _testDeliverEvents() to replay events synchronously
 * without making a real network request.
 */
@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly endpoint = '/api/chat/stream';

  /** Callbacks for the current active stream — set by stream(), cleared on terminal event */
  private _callbacks: StreamCallbacks | null = null;

  /** Abort controller for the current request */
  private _ctrl: AbortController | null = null;

  /**
   * Test-mode flag: when true, skip fetchEventSource.
   * Set by _testDeliverEvents before events are delivered.
   */
  private _testMode = false;

  /**
   * Begin streaming a chat turn.
   * Each SSE data payload is forwarded to onToken.
   * Terminal 'complete' event triggers onComplete.
   * Mid-turn 'error' event triggers onError.
   * HTTP 404 triggers onNotFound.
   */
  stream(sessionId: string, message: string, callbacks: StreamCallbacks): void {
    this._callbacks = callbacks;

    // In test mode, skip the real fetch — _testDeliverEvents handles delivery
    if (this._testMode) {
      return;
    }

    const ctrl = new AbortController();
    this._ctrl = ctrl;

    fetchEventSource(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ sessionId, message }),
      signal: ctrl.signal,

      onopen: async (response: Response) => {
        if (response.status === 404) {
          ctrl.abort();
          callbacks.onNotFound();
          this._callbacks = null;
          return;
        }
        if (!response.ok) {
          ctrl.abort();
          callbacks.onError(`HTTP ${response.status}`);
          this._callbacks = null;
        }
      },

      onmessage: (event) => {
        if (event.event === 'complete' || event.data === 'complete') {
          ctrl.abort();
          callbacks.onComplete();
          this._callbacks = null;
          return;
        }
        if (event.event === 'error') {
          ctrl.abort();
          callbacks.onError(event.data || 'Błąd strumienia');
          this._callbacks = null;
          return;
        }
        // Regular data token
        if (event.data) {
          callbacks.onToken(event.data);
        }
      },

      onerror: (err: unknown) => {
        callbacks.onError(String(err));
        this._callbacks = null;
        throw err; // stop reconnection
      },
    });
  }

  /**
   * Test hook: deliver SSE events synchronously, bypassing the real fetch.
   * Must be called AFTER stream() to replay events.
   *
   * Pass { status: 404 } to simulate a 404 response.
   *
   * @internal — for unit tests only
   */
  _testDeliverEvents(events: TestEvent[], options?: { status?: number }): void {
    this._testMode = true;

    const cb = this._callbacks;
    if (!cb) {
      this._testMode = false;
      return;
    }

    if (options?.status === 404) {
      cb.onNotFound();
      this._callbacks = null;
      this._testMode = false;
      return;
    }

    for (const ev of events) {
      if (!this._callbacks) break;

      if (ev.type === 'complete') {
        cb.onComplete();
        this._callbacks = null;
        break;
      } else if (ev.type === 'error') {
        cb.onError(ev.data || 'Błąd strumienia');
        this._callbacks = null;
        break;
      } else {
        cb.onToken(ev.data);
      }
    }

    this._testMode = false;
  }
}
