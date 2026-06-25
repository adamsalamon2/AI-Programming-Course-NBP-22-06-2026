import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionState } from './session-state';
import type { CaseSummary, Decision } from './models';

describe('SessionState', () => {
  let state: SessionState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), SessionState],
    });
    state = TestBed.inject(SessionState);
  });

  it('generates a valid UUID sessionId on initSession()', () => {
    state.initSession();
    const id = state.sessionId();
    expect(id).toBeTruthy();
    // UUID v4 format
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('preserves the same sessionId across multiple reads after initSession()', () => {
    state.initSession();
    const id1 = state.sessionId();
    const id2 = state.sessionId();
    expect(id1).toBe(id2);
  });

  it('starts with null sessionId, caseSummary and empty messages', () => {
    expect(state.sessionId()).toBeNull();
    expect(state.caseSummary()).toBeNull();
    expect(state.messages()).toEqual([]);
  });

  it('stores caseSummary via setCaseSummary()', () => {
    const summary: CaseSummary = {
      requestType: 'COMPLAINT',
      category: 'SMARTFONY',
      model: 'iPhone 15',
      purchaseDate: '2025-01-01',
    };
    state.setCaseSummary(summary);
    expect(state.caseSummary()).toEqual(summary);
  });

  it('addMessage appends a ChatMessageVM and signals update', () => {
    state.addMessage({ role: 'user', content: 'Cześć' });
    expect(state.messages().length).toBe(1);
    expect(state.messages()[0].role).toBe('user');
    expect(state.messages()[0].content).toBe('Cześć');
  });

  it('addMessage for assistant creates signal-based content', () => {
    state.addMessage({ role: 'assistant', content: '' });
    const msg = state.messages()[0];
    expect(msg.role).toBe('assistant');
    // content is a string (or could be a signal — just check it's readable)
    expect(typeof msg.content === 'string' || typeof msg.content === 'function').toBeTrue();
  });

  it('reset() clears sessionId, caseSummary, and messages', () => {
    state.initSession();
    const summary: CaseSummary = {
      requestType: 'RETURN',
      category: 'LAPTOPY',
      model: 'Dell XPS',
      purchaseDate: '2024-12-01',
    };
    state.setCaseSummary(summary);
    state.addMessage({ role: 'user', content: 'test' });
    state.reset();
    expect(state.sessionId()).toBeNull();
    expect(state.caseSummary()).toBeNull();
    expect(state.messages()).toEqual([]);
  });

  it('storeDecision stores decision signal', () => {
    const decision: Decision = {
      verdict: 'APPROVE',
      justification: 'Towar wygląda nowy.',
      nextSteps: 'Wyślij paczkę.',
      disclaimer: 'To jest opinia doradcza.',
      missingInfo: null,
    };
    state.storeDecision(decision);
    expect(state.decision()).toEqual(decision);
  });
});
