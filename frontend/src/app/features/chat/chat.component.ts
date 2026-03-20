import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
  meta: string;
};

type QuickAction = {
  label: string;
  hint: string;
  prompt: string;
};

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <section class="chat-page">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="section-badge">Assistant</span>
          <h2>Ask the assistant</h2>
          <p>Use chat for tasks, plans, and reminders.</p>

          <div class="chip-row">
            <button type="button" class="action-chip" *ngFor="let item of quickActions" (click)="usePrompt(item.prompt)">
              <span class="chip-title">{{ item.label }}</span>
              <small>{{ item.hint }}</small>
            </button>
          </div>
        </div>

        <aside class="assist-panel">
          <div class="panel-glow"></div>
          <div class="assist-header">
            <div class="assist-avatar">AI</div>
            <div>
              <strong>Nova Assistant</strong>
              <span>{{ isThinking ? 'Thinking...' : 'Ready' }}</span>
            </div>
          </div>

          <div class="quick-actions">
            <button type="button" *ngFor="let item of quickActions" (click)="usePrompt(item.prompt)">
              {{ item.label }}
            </button>
          </div>
        </aside>
      </section>

      <section class="chat-shell">
        <div class="conversation-head">
          <div>
            <span class="conversation-kicker">Chat</span>
            <h3>Assistant chat</h3>
          </div>
          <div class="conversation-status" [class.busy]="isThinking">
            <span class="status-orb"></span>
            {{ isThinking ? 'AI is typing...' : 'Connected' }}
          </div>
        </div>

        <div class="messages" #scrollContainer>
          <div class="welcome-card" *ngIf="messages.length === 1 && !isThinking">
            <div class="welcome-illustration">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div>
              <strong>Start with a quick action or type a message.</strong>
              <p>Example: “Create a task for tomorrow.”</p>
            </div>
          </div>

          <div
            class="message-row"
            *ngFor="let message of messages"
            [class.user-row]="message.role === 'user'"
            [class.assistant-row]="message.role === 'assistant'">
            <div class="avatar" [class.user-avatar]="message.role === 'user'" [class.assistant-avatar]="message.role === 'assistant'">
              {{ message.role === 'user' ? 'YU' : 'AI' }}
            </div>

            <article
              class="bubble"
              [class.user-bubble]="message.role === 'user'"
              [class.assistant-bubble]="message.role === 'assistant'">
              <div class="bubble-meta">
                <span>{{ message.role === 'user' ? 'You' : 'Assistant' }}</span>
                <small>{{ message.meta }}</small>
              </div>
              <p>{{ message.text }}</p>
            </article>
          </div>

          <div class="message-row assistant-row" *ngIf="isThinking">
            <div class="avatar assistant-avatar">AI</div>
            <article class="bubble assistant-bubble thinking-bubble">
              <div class="bubble-meta">
                <span>Assistant</span>
                <small>Typing...</small>
              </div>

              <div class="typing-shell" aria-label="Assistant is thinking">
                <div class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="skeleton-lines">
                  <span></span>
                  <span></span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="quick-bar">
          <button type="button" *ngFor="let item of quickActions" (click)="usePrompt(item.prompt)">
            {{ item.label }}
          </button>
        </div>

        <form class="composer" (ngSubmit)="send()">
          <button type="button" class="composer-icon" aria-label="Attach file">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.4 11.2 12 20.6a6 6 0 1 1-8.5-8.5l9.2-9.2a4 4 0 1 1 5.7 5.7L9.5 17.5a2 2 0 0 1-2.8-2.8l8.1-8.1"></path>
            </svg>
          </button>

          <label class="composer-field">
            <textarea
              [(ngModel)]="draft"
              name="draft"
              rows="2"
              (keydown)="handleComposerKeydown($event)"
              [disabled]="isThinking"
              placeholder="Ask anything: create a task, plan your day, summarize priorities, or set a reminder"></textarea>
          </label>

          <button type="button" class="composer-icon" aria-label="Voice input">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Zm6 7a6 6 0 0 1-12 0M12 17v3m-4 0h8"></path>
            </svg>
          </button>

          <button type="submit" class="send-button" [disabled]="isThinking || !draft.trim()">
            <span>{{ isThinking ? 'Sending...' : 'Send' }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h13m0 0-5-5m5 5-5 5"></path>
            </svg>
          </button>
        </form>
      </section>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .chat-page {
      display: grid;
      gap: 20px;
    }

    .hero-card,
    .chat-shell {
      border-radius: 32px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background:
        linear-gradient(160deg, var(--shell-panel-top), var(--shell-panel-bottom)),
        radial-gradient(circle at top right, rgba(192, 132, 252, 0.16), transparent 36%);
      backdrop-filter: blur(24px);
      box-shadow: var(--shadow-lg);
    }

    .hero-card {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(280px, 360px);
      gap: 20px;
      padding: 28px;
      overflow: hidden;
      position: relative;
    }

    .section-badge {
      display: inline-flex;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(79, 70, 229, 0.18);
      color: var(--accent);
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h2 {
      margin: 16px 0 0;
      font-size: clamp(2.2rem, 4vw, 3.6rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
      color: var(--heading);
      max-width: 720px;
    }

    .hero-copy p {
      margin: 16px 0 0;
      max-width: 760px;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.75;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .action-chip {
      display: grid;
      gap: 3px;
      min-width: 180px;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: var(--card-soft);
      color: var(--text);
      cursor: pointer;
      text-align: left;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .action-chip:hover,
    .quick-actions button:hover,
    .quick-bar button:hover {
      transform: translateY(-2px);
      border-color: rgba(99, 102, 241, 0.24);
      box-shadow: 0 16px 30px rgba(79, 70, 229, 0.16);
      background: var(--surface-strong);
    }

    .chip-title {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .action-chip small {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .assist-panel {
      position: relative;
      padding: 18px;
      border-radius: 26px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: var(--card-soft);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .panel-glow {
      position: absolute;
      inset: -20% -25% auto auto;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.22), transparent 68%);
      filter: blur(16px);
      pointer-events: none;
    }

    .assist-header {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .assist-avatar {
      width: 54px;
      height: 54px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      box-shadow: 0 18px 34px rgba(79, 70, 229, 0.28);
      color: #ffffff;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .assist-header strong,
    .assist-header span {
      display: block;
    }

    .assist-header strong {
      color: var(--heading);
      font-size: 1rem;
      font-weight: 700;
    }

    .assist-header span {
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .quick-actions,
    .quick-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .quick-actions {
      margin-top: 20px;
    }

    .quick-actions button,
    .quick-bar button {
      padding: 11px 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: var(--surface-soft);
      color: var(--text);
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .chat-shell {
      display: grid;
      gap: 16px;
      padding: 24px;
    }

    .conversation-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }

    .conversation-kicker {
      display: inline-flex;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .conversation-head h3 {
      margin: 0;
      color: var(--heading);
      font-size: 1.6rem;
      letter-spacing: -0.03em;
    }

    .conversation-status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 0.84rem;
      font-weight: 700;
    }

    .conversation-status.busy {
      color: #c7d2fe;
      background: rgba(79, 70, 229, 0.16);
    }

    .status-orb {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 16px rgba(34, 197, 94, 0.7);
    }

    .conversation-status.busy .status-orb {
      background: #818cf8;
      box-shadow: 0 0 16px rgba(129, 140, 248, 0.7);
    }

    .messages {
      display: grid;
      gap: 18px;
      min-height: 460px;
      max-height: 62vh;
      overflow-y: auto;
      padding-right: 4px;
      align-content: start;
    }

    .welcome-card {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 18px;
      padding: 20px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: var(--card-soft);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }

    .welcome-illustration {
      position: relative;
      width: 92px;
      height: 92px;
      border-radius: 28px;
      background:
        radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3), transparent 42%),
        linear-gradient(135deg, rgba(79, 70, 229, 0.28), rgba(236, 72, 153, 0.18));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      overflow: hidden;
    }

    .welcome-illustration span {
      position: absolute;
      border-radius: 999px;
      background: rgba(255,255,255,0.82);
      box-shadow: 0 0 18px rgba(255,255,255,0.28);
    }

    .welcome-illustration span:nth-child(1) {
      width: 18px;
      height: 18px;
      top: 18px;
      left: 18px;
    }

    .welcome-illustration span:nth-child(2) {
      width: 10px;
      height: 10px;
      top: 22px;
      right: 18px;
    }

    .welcome-illustration span:nth-child(3) {
      width: 44px;
      height: 44px;
      right: 14px;
      bottom: 14px;
      background: rgba(255,255,255,0.18);
    }

    .welcome-card strong {
      color: var(--heading);
      font-size: 1.02rem;
      font-weight: 700;
    }

    .welcome-card p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.65;
    }

    .message-row {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr);
      gap: 12px;
      align-items: end;
      animation: riseIn 0.28s ease;
    }

    .user-row {
      grid-template-columns: minmax(0, 1fr) 48px;
    }

    .user-row .avatar {
      order: 2;
    }

    .user-row .bubble {
      order: 1;
      justify-self: end;
    }

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #ffffff;
      box-shadow: 0 14px 28px rgba(2, 6, 23, 0.28);
    }

    .assistant-avatar {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.92), rgba(192, 132, 252, 0.8));
    }

    .user-avatar {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(236, 72, 153, 0.78));
    }

    .bubble {
      width: min(100%, 760px);
      padding: 16px 18px;
      border-radius: 24px;
      position: relative;
      box-shadow: var(--shadow-md);
    }

    .assistant-bubble {
      background:
        linear-gradient(160deg, var(--assistant-bubble-start), var(--assistant-bubble-end)),
        var(--surface);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-top-left-radius: 10px;
      backdrop-filter: blur(18px);
    }

    .user-bubble {
      background:
        linear-gradient(135deg, rgba(79, 70, 229, 0.96), rgba(59, 130, 246, 0.92)),
        linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(255,255,255,0));
      border: 1px solid rgba(129, 140, 248, 0.2);
      border-top-right-radius: 10px;
      box-shadow: 0 24px 44px rgba(79, 70, 229, 0.28);
    }

    .bubble-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .bubble-meta span {
      color: var(--heading);
      font-size: 0.88rem;
      font-weight: 700;
    }

    .bubble-meta small {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .user-bubble .bubble-meta span,
    .user-bubble .bubble-meta small,
    .user-bubble p {
      color: rgba(255,255,255,0.9);
    }

    .bubble p {
      margin: 0;
      color: var(--assistant-bubble-text);
      font-size: 0.98rem;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .thinking-bubble {
      max-width: 320px;
    }

    .typing-shell {
      display: grid;
      gap: 14px;
      align-items: center;
    }

    .thinking-dots {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }

    .thinking-dots span {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      box-shadow: 0 0 12px rgba(129, 140, 248, 0.5);
      animation: pulse 1s infinite ease-in-out;
    }

    .thinking-dots span:nth-child(2) {
      animation-delay: 0.15s;
    }

    .thinking-dots span:nth-child(3) {
      animation-delay: 0.3s;
    }

    .skeleton-lines {
      display: grid;
      gap: 8px;
    }

    .skeleton-lines span {
      display: block;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08));
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
    }

    .skeleton-lines span:first-child {
      width: 180px;
    }

    .skeleton-lines span:last-child {
      width: 120px;
    }

    .quick-bar {
      padding-top: 4px;
    }

    .composer {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) 48px auto;
      gap: 12px;
      align-items: end;
      padding: 14px;
      border-radius: 28px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background:
        linear-gradient(160deg, var(--card-strong), var(--card-soft)),
        var(--surface);
      backdrop-filter: blur(22px);
      box-shadow: var(--shadow-md);
      position: sticky;
      bottom: 0;
    }

    .composer-field {
      display: block;
    }

    textarea {
      width: 100%;
      min-height: 74px;
      resize: vertical;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: #ffffff;
      color: #111111;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
      caret-color: #111111;
    }

    textarea::placeholder {
      color: var(--muted);
    }

    textarea:focus {
      border-color: rgba(99, 102, 241, 0.34);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.14), 0 18px 34px rgba(2, 6, 23, 0.2);
      background: #ffffff;
    }

    textarea:disabled {
      opacity: 0.72;
      cursor: wait;
    }

    .composer-icon,
    .send-button {
      border: 0;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    }

    .composer-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .composer-icon svg,
    .send-button svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .composer-icon:hover,
    .send-button:hover:not(:disabled) {
      transform: translateY(-1px) scale(1.02);
    }

    .send-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-radius: 20px;
      background:
        linear-gradient(135deg, rgba(79, 70, 229, 0.98), rgba(59, 130, 246, 0.92)),
        linear-gradient(135deg, rgba(236, 72, 153, 0.16), rgba(255,255,255,0));
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 20px 38px rgba(79, 70, 229, 0.3);
    }

    .send-button:disabled {
      opacity: 0.72;
      cursor: not-allowed;
      box-shadow: none;
    }

    @keyframes pulse {
      0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.28;
      }
      40% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @keyframes riseIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1280px) {
      .hero-card {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 960px) {
      .conversation-head {
        flex-direction: column;
        align-items: flex-start;
      }

      .composer {
        grid-template-columns: 1fr;
      }

      .composer-icon {
        display: none;
      }

      .send-button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 760px) {
      .chat-shell,
      .hero-card {
        padding: 18px;
        border-radius: 26px;
      }

      h2 {
        font-size: 1.7rem;
      }

      .welcome-card {
        grid-template-columns: 1fr;
      }

      .message-row,
      .user-row {
        grid-template-columns: 1fr;
      }

      .user-row .avatar,
      .user-row .bubble {
        order: initial;
      }

      .avatar {
        display: none;
      }

      .bubble {
        width: 100%;
      }
    }
  `]
})
export class ChatComponent {
  private readonly api = inject(ApiService);

  @ViewChild('scrollContainer')
  private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly quickActions: QuickAction[] = [
    {
      label: 'Create Task',
      hint: 'Turn ideas into action',
      prompt: 'Create a task to finish the monthly report by tomorrow at 5 PM'
    },
    {
      label: 'Plan My Day',
      hint: 'Generate a focused schedule',
      prompt: 'Plan my day around the most urgent tasks and keep it realistic'
    },
    {
      label: 'Reminder',
      hint: 'Never forget a follow-up',
      prompt: 'Remind me to call my parents this evening'
    },
    {
      label: 'Priority Check',
      hint: 'See what matters next',
      prompt: 'Tell me which task I should do next and why'
    }
  ];

  draft = '';
  isThinking = false;
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'I can help with tasks, plans, and reminders.',
      meta: 'Just now'
    }
  ];

  send() {
    const content = this.draft.trim();
    if (!content || this.isThinking) {
      return;
    }

    this.messages = [
      ...this.messages,
      { role: 'user', text: content, meta: this.timestamp() }
    ];
    this.draft = '';
    this.isThinking = true;
    this.scrollToBottom();

    this.api.sendChat(content).subscribe({
      next: (response) => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            text: response.data?.response || 'The assistant replied without a message.',
            meta: this.timestamp()
          }
        ];
        this.isThinking = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            text: 'Something went wrong while contacting the assistant. Please try again.',
            meta: this.timestamp()
          }
        ];
        this.isThinking = false;
        this.scrollToBottom();
      }
    });
  }

  usePrompt(prompt: string) {
    if (this.isThinking) {
      return;
    }

    this.draft = prompt;
  }

  handleComposerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.send();
  }

  private scrollToBottom() {
    queueMicrotask(() => {
      const element = this.scrollContainer?.nativeElement;
      if (!element) {
        return;
      }

      element.scrollTop = element.scrollHeight;
    });
  }

  private timestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
