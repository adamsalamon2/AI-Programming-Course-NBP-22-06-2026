import { Component, OnInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { SessionState } from '../../../core/session-state';
import { ChatApiService } from '../../../core/chat-api.service';
import { pl } from '../../../i18n/pl';
import type { ChatMessageVM } from '../../../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatExpansionModule,
    MessageBubbleComponent,
    TypingIndicatorComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  @ViewChild('messageListEnd') private messageListEnd?: ElementRef<HTMLDivElement>;

  readonly labels = pl;

  /** Whether the assistant is currently streaming a response */
  readonly streaming = signal(false);

  /** Per-turn retry error (null = no error) */
  readonly turnError = signal<string | null>(null);

  /** True when a 404 was received (unknown session) */
  readonly sessionNotFound = signal(false);

  readonly inputCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor(
    readonly session: SessionState,
    private readonly chatApi: ChatApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Build the first agent message from the stored decision
    const decision = this.session.decision();
    if (!decision) {
      return; // no decision yet — shouldn't happen in normal flow
    }

    // Build the decision message as Markdown
    const verdictLabel = this.labels.verdict[decision.verdict];
    let content = `## ${verdictLabel}\n\n`;
    content += `${decision.justification}\n\n`;
    content += `### Następne kroki\n\n${decision.nextSteps}\n\n`;

    if (decision.verdict === 'NEEDS_REVIEW' && decision.missingInfo) {
      content += `### Brakujące informacje\n\n${decision.missingInfo}\n\n`;
    }

    content += `---\n\n**${this.labels.chat.disclaimerHeader}:** ${decision.disclaimer}`;

    this.session.addMessage({ role: 'assistant', content });
  }

  /** All messages from the session */
  get messages(): ChatMessageVM[] {
    return this.session.messages();
  }

  /** Case summary for the header panel */
  get caseSummary() {
    return this.session.caseSummary();
  }

  sendMessage(): void {
    if (this.inputCtrl.invalid || this.streaming()) return;

    const text = this.inputCtrl.value.trim();
    if (!text) return;

    this.inputCtrl.reset();
    this.turnError.set(null);
    this.sessionNotFound.set(false);

    // Add user message
    this.session.addMessage({ role: 'user', content: text });

    // Add assistant placeholder
    this.session.addMessage({ role: 'assistant', content: '', streaming: true });

    this.streaming.set(true);
    this.inputCtrl.disable({ emitEvent: false });
    this.scrollToBottom();

    const sessionId = this.session.sessionId();
    if (!sessionId) {
      this.streaming.set(false);
      this.inputCtrl.enable({ emitEvent: false });
      return;
    }

    this.chatApi.stream(sessionId, text, {
      onToken: (token) => {
        this.session.appendTokenToLastMessage(token);
        this.scrollToBottom();
      },
      onComplete: () => {
        this.session.finalizeLastMessage();
        this.streaming.set(false);
        this.inputCtrl.enable({ emitEvent: false });
        this.scrollToBottom();
      },
      onError: (message) => {
        this.removeLastAssistantBubble();
        this.streaming.set(false);
        this.inputCtrl.enable({ emitEvent: false });
        this.turnError.set(message || this.labels.chat.errorTurn);
      },
      onNotFound: () => {
        this.removeLastAssistantBubble();
        this.streaming.set(false);
        this.sessionNotFound.set(true);
      },
    });
  }

  retryLastMessage(): void {
    this.turnError.set(null);
    // Re-add the last user message (the last message before error was user's)
    const msgs = this.session.messages();
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      // Simply re-send the content as a new user turn
      const content = lastUser.content;
      this.session.addMessage({ role: 'assistant', content: '', streaming: true });
      this.streaming.set(true);

      const sessionId = this.session.sessionId();
      if (!sessionId) {
        this.streaming.set(false);
        return;
      }

      this.chatApi.stream(sessionId, content, {
        onToken: (token) => this.session.appendTokenToLastMessage(token),
        onComplete: () => {
          this.session.finalizeLastMessage();
          this.streaming.set(false);
        },
        onError: (message) => {
          this.removeLastAssistantBubble();
          this.streaming.set(false);
          this.turnError.set(message || this.labels.chat.errorTurn);
        },
        onNotFound: () => {
          this.removeLastAssistantBubble();
          this.streaming.set(false);
          this.sessionNotFound.set(true);
        },
      });
    }
  }

  startNewCase(): void {
    this.session.reset();
    this.router.navigate(['/']);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private removeLastAssistantBubble(): void {
    const msgs = this.session.messages();
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.role === 'assistant' && lastMsg?.streaming) {
      this.session.removeLastMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      this.messageListEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // Ignore scroll errors in tests
    }
  }
}
