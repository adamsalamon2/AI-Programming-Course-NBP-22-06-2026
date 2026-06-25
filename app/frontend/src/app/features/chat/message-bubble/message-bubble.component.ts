import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';

/**
 * MessageBubbleComponent — renders a single chat message.
 * - Agent (assistant) messages: rendered via ngx-markdown (headings, lists, emphasis).
 * - User messages: plain styled text.
 * Clear visual distinction between the two roles via CSS classes.
 */
@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, MarkdownComponent],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss',
})
export class MessageBubbleComponent {
  @Input() role: 'assistant' | 'user' = 'user';
  @Input() content = '';
}
