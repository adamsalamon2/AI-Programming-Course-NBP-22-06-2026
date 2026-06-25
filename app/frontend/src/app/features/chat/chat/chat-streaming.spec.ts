import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown } from 'ngx-markdown';
import { provideRouter } from '@angular/router';
import { ChatComponent } from './chat.component';
import { SessionState } from '../../../core/session-state';
import { ChatApiService } from '../../../core/chat-api.service';
import type { Decision, CaseSummary } from '../../../core/models';

const decision: Decision = {
  verdict: 'APPROVE',
  justification: 'Wygląda nowo.',
  nextSteps: 'Wyślij.',
  disclaimer: 'Opinia doradcza.',
  missingInfo: null,
};

const caseSummary: CaseSummary = {
  requestType: 'RETURN',
  category: 'LAPTOPY',
  model: 'Dell',
  purchaseDate: '2025-01-01',
};

describe('ChatComponent — send + streaming render', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  let sessionState: SessionState;
  let chatApi: ChatApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideAnimationsAsync(),
        provideMarkdown(),
        provideRouter([]),
      ],
    }).compileComponents();

    sessionState = TestBed.inject(SessionState);
    chatApi = TestBed.inject(ChatApiService);

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

  it('creates the component with initial decision message', () => {
    expect(sessionState.messages().length).toBe(1); // first agent message from ngOnInit
  });

  it('sendMessage appends user message to session', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Pytanie testowe');
    component.sendMessage();
    const msgs = sessionState.messages();
    // First message = decision, second = user message, third = streaming assistant
    expect(msgs.some((m) => m.role === 'user' && m.content === 'Pytanie testowe')).toBeTrue();
  });

  it('sendMessage creates streaming assistant bubble', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();
    const msgs = sessionState.messages();
    const streamingBubble = msgs.find((m) => m.role === 'assistant' && m.streaming === true);
    expect(streamingBubble).toBeTruthy();
  });

  it('streaming=true during token delivery', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();
    // After sendMessage, streaming should be true (no events delivered yet)
    expect(component.streaming()).toBeTrue();
  });

  it('tokens are appended to the assistant bubble', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();

    chatApi['_testDeliverEvents']([
      { type: 'message', data: 'Token1' },
      { type: 'message', data: ' Token2' },
    ]);

    const msgs = sessionState.messages();
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
    expect(lastAssistant?.content).toContain('Token1');
    expect(lastAssistant?.content).toContain(' Token2');
  });

  it('streaming=false after complete event', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();

    chatApi['_testDeliverEvents']([
      { type: 'message', data: 'Odpowiedź' },
      { type: 'complete', data: '' },
    ]);

    expect(component.streaming()).toBeFalse();
  });

  it('typing indicator is visible while streaming', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('Test');
    component.sendMessage();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const indicator = el.querySelector('.typing-indicator');
    expect(indicator).toBeTruthy(); // visible while streaming
  });

  it('does not send empty message', () => {
    chatApi['_testMode'] = true;
    component.inputCtrl.setValue('   ');
    const msgsBefore = sessionState.messages().length;
    component.sendMessage();
    expect(sessionState.messages().length).toBe(msgsBefore);
  });
});
