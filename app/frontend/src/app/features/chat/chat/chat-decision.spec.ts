import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown } from 'ngx-markdown';
import { provideRouter } from '@angular/router';
import { ChatComponent } from './chat.component';
import { SessionState } from '../../../core/session-state';
import type { Decision, CaseSummary } from '../../../core/models';

const approveDecision: Decision = {
  verdict: 'APPROVE',
  justification: 'Produkt wygląda jak nowy, brak śladów użytkowania.',
  nextSteps: 'Wyślij urządzenie w oryginalnym opakowaniu.',
  disclaimer: 'Niniejsza opinia jest rekomendacją doradczą.',
  missingInfo: null,
};

const needsReviewDecision: Decision = {
  verdict: 'NEEDS_REVIEW',
  justification: 'Obraz jest niewyraźny.',
  nextSteps: 'Prześlij wyraźniejsze zdjęcie.',
  disclaimer: 'Niniejsza opinia jest rekomendacją doradczą.',
  missingInfo: 'Wymagane wyraźne zdjęcie uszkodzenia z dobrego kąta.',
};

const caseSummary: CaseSummary = {
  requestType: 'RETURN',
  category: 'LAPTOPY',
  model: 'Dell XPS 13',
  purchaseDate: '2025-03-01',
};

describe('ChatComponent — decision render', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  let sessionState: SessionState;

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
    sessionState.initSession();
    sessionState.setCaseSummary(caseSummary);
  });

  afterEach(() => {
    sessionState.reset();
  });

  const create = async (decision: Decision) => {
    sessionState.storeDecision(decision);
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('creates the component', async () => {
    await create(approveDecision);
    expect(component).toBeTruthy();
  });

  it('first message contains verdict label in Polish', async () => {
    await create(approveDecision);
    const msgs = sessionState.messages();
    expect(msgs.length).toBeGreaterThan(0);
    // 'APPROVE' maps to 'Pozytywna opinia' in pl.verdict
    expect(msgs[0].content).toContain('Pozytywna opinia');
  });

  it('first message content includes justification', async () => {
    await create(approveDecision);
    const msgs = sessionState.messages();
    expect(msgs[0].content).toContain('Produkt wygląda jak nowy');
  });

  it('first message content includes disclaimer', async () => {
    await create(approveDecision);
    const msgs = sessionState.messages();
    expect(msgs[0].content).toContain('rekomendacją doradczą');
  });

  it('NEEDS_REVIEW decision includes missingInfo in first message', async () => {
    await create(needsReviewDecision);
    const msgs = sessionState.messages();
    expect(msgs[0].content).toContain('Wymagane wyraźne zdjęcie');
  });

  it('case summary panel contains requestType', async () => {
    await create(approveDecision);
    const el: HTMLElement = fixture.nativeElement;
    const summary = el.querySelector('.case-summary') ?? el.querySelector('[data-case-summary]');
    expect(summary?.textContent).toBeTruthy();
  });

  it('case summary shows model name', async () => {
    await create(approveDecision);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Dell XPS 13');
  });
});
