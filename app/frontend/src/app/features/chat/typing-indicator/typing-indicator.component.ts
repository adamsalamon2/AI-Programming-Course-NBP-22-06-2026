import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * TypingIndicatorComponent — CSS 3-dot animation shown while the agent streams.
 * Visible when [streaming]=true, hidden when false.
 * Satisfies PRD AC-24.
 */
@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-indicator.component.html',
  styleUrl: './typing-indicator.component.scss',
})
export class TypingIndicatorComponent {
  @Input() streaming = false;
}
