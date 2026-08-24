import { HttpClient } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'proto-inline-ai',
  imports: [FormsModule],
  templateUrl: './inline-ai.component.html',
})
export class InlineAiComponent {
  title = input('Assistant');
  context = input('');
  placeholder = input('Describe what you want to create…');
  private http = inject(HttpClient);
  prompt = '';
  sessionId?: string;
  loading = signal(false);
  messages = signal<
    {
      role: string;
      content: string;
    }[]
  >([]);
  send() {
    const text = this.prompt.trim();
    if (!text) return;
    this.messages.update((x) => [
      ...x,
      {
        role: 'user',
        content: text,
      },
    ]);
    this.prompt = '';
    this.loading.set(true);
    const context = this.context();
    const message = context ? `${context}\n\nAdmin request: ${text}` : text;
    this.http
      .post<any>('/api/ai/chat', {
        message,
        sessionId: this.sessionId,
      })
      .subscribe({
        next: (x) => {
          this.sessionId = x.sessionId;
          this.messages.update((m) => [
            ...m,
            {
              role: 'assistant',
              content: x.message,
            },
          ]);
          this.loading.set(false);
        },
        error: () => {
          this.messages.update((m) => [
            ...m,
            {
              role: 'assistant',
              content: 'AI integration is not configured or the request failed.',
            },
          ]);
          this.loading.set(false);
        },
      });
  }
}
