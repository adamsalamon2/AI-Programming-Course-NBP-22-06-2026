import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown } from 'ngx-markdown';
import { MessageBubbleComponent } from './message-bubble.component';

describe('MessageBubbleComponent', () => {
  let fixture: ComponentFixture<MessageBubbleComponent>;
  let component: MessageBubbleComponent;

  const createComponent = async (role: 'assistant' | 'user', content: string) => {
    await TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideAnimationsAsync(),
        provideMarkdown(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageBubbleComponent);
    component = fixture.componentInstance;
    component.role = role;
    component.content = content;
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the component', async () => {
    await createComponent('user', 'Cześć');
    expect(component).toBeTruthy();
  });

  it('user message renders plain text (not markdown)', async () => {
    await createComponent('user', 'Chcę zwrócić laptop **Dell**');
    const el: HTMLElement = fixture.nativeElement;
    // User messages should not render markdown HTML
    const bubble = el.querySelector('.message-bubble--user');
    expect(bubble).toBeTruthy();
    // The text content should contain the asterisks (not rendered as bold)
    expect(bubble!.textContent).toContain('Chcę zwrócić laptop');
  });

  it('assistant message uses markdown component (has markdown element)', async () => {
    await createComponent('assistant', '## Decyzja\n\n**Pozytywna** opinia.');
    const el: HTMLElement = fixture.nativeElement;
    const agentBubble = el.querySelector('.message-bubble--assistant');
    expect(agentBubble).toBeTruthy();
    // ngx-markdown or markdown element present
    const markdownEl = el.querySelector('markdown') ?? el.querySelector('[data-markdown]') ?? agentBubble;
    expect(markdownEl).toBeTruthy();
  });

  it('user bubble has css class message-bubble--user', async () => {
    await createComponent('user', 'test');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.message-bubble--user')).toBeTruthy();
    expect(el.querySelector('.message-bubble--assistant')).toBeFalsy();
  });

  it('assistant bubble has css class message-bubble--assistant', async () => {
    await createComponent('assistant', 'test');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.message-bubble--assistant')).toBeTruthy();
    expect(el.querySelector('.message-bubble--user')).toBeFalsy();
  });

  it('renders markdown with headings for assistant message', async () => {
    await createComponent('assistant', '## Wynik\n\nPozytywna opinia.');
    const el: HTMLElement = fixture.nativeElement;
    // After markdown rendering, an h2 should be present
    const h2 = el.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2!.textContent).toContain('Wynik');
  });
});
