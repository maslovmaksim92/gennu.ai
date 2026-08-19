import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai.component.html',
})
export class AiComponent {
  http = inject(HttpClient);
  message = '';
  sessionId?: string;
  loading = signal(false);
  messages = signal<
    {
      role: string;
      content: string;
    }[]
  >([]);
  send() {
    const text = this.message.trim();
    if (!text) return;
    this.messages.update((x) => [
      ...x,
      {
        role: 'user',
        content: text,
      },
    ]);
    this.message = '';
    this.loading.set(true);
    this.http
      .post<any>('/api/ai/chat', {
        message: text,
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
