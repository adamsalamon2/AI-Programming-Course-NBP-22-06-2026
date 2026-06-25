import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown } from 'ngx-markdown';
import { provideRouter, Router } from '@angular/router';
import { ChatComponent } from './chat.component';
import { SessionState } from '../../../core/session-state';
import { ChatApiService } from '../../../core/chat-api.service';
import type { Decision, CaseSummary } from '../../../core/models';

const decision: Decision = {
  verdict: 'REJECT',
  justification: 'Uszkodzenie mechaniczne.',
  nextSteps: 'Skontaktuj się z serwisem.',
  disclaimer: 'Opinia doradcza.',
  missingInfo: null,
};

const caseSummary: CaseSummary = {
  requestType: 'COMPLAINT',
  category: 'SMARTFONY',
  model: 'iPhone 15',
  purchaseDate: '2025-01-01',
};

describe('ChatComponent — error handling + retry', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  let sessionState: SessionState;
  let chatApi: ChatApiService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideAnimationsAsync(),
        provideMarkdown(),
        provideRouter([{ path: '', component: ChatComponent }]),
      ],
    }).compileComponents();

    sessionState = TestBed.inject(SessionState);
    chatApi = TestBed.inject(ChatApiService);
    router = TestBed.inject(Router);

    sessionState.initSession();
    sessionState.setCaseSummary(caseSummary);
    sessionState.storeDecision(decision);

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionState.reset();
  });

  it('mid-turn error shows turnError without destroying prior messages', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Pytanie');
    component.sendMessage();

    const msgsBefore = sessionState.messages().length;

    chatApi['_testDeliverEvents']([
      { type: 'error', data: 'Błąd połączenia' },
    ]);

    // Prior messages still intact (decision + user message)
    expect(sessionState.messages().length).toBeGreaterThanOrEqual(2);
    // Streaming bubble was removed
    expect(sessionState.messages().some((m) => m.streaming)).toBeFalse();
    // Error is shown
    expect(component.turnError()).toBeTruthy();
    expect(component.turnError()).toContain('Błąd');
  });

  it('streaming is false after error', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();
    chatApi['_testDeliverEvents']([{ type: 'error', data: 'err' }]);
    expect(component.streaming()).toBeFalse();
  });

  it('404 onNotFound triggers sessionNotFound signal', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();
    chatApi['_testDeliverEvents']([], { status: 404 });
    expect(component.sessionNotFound()).toBeTrue();
  });

  it('startNewCase resets session and navigates to /', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.startNewCase();
    expect(sessionState.sessionId()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('retryLastMessage re-sends the last user message', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Pierwsze pytanie');
    component.sendMessage();
    chatApi['_testDeliverEvents']([{ type: 'error', data: 'err' }]);

    // Now retry — should initiate new streaming
    component.turnError.set(null);
    component.retryLastMessage();
    expect(component.streaming()).toBeTrue();
    // Clean up
    chatApi['_testDeliverEvents']([{ type: 'complete', data: '' }]);
  });
});
