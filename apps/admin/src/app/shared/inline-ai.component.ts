import { HttpClient } from '@angular/common/http';
import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'proto-inline-ai',
  standalone: true,
  imports: [FormsModule],
  template: `<aside class="inline-ai">
    <div class="inline-ai-head"><div><span class="eyebrow">AI COPILOT</span><h3>{{title}}</h3></div><span class="status">Chat</span></div>
    <div class="inline-ai-messages">
      @for(item of messages(); track $index) {
        <div class="mini-message" [class.me]="item.role === 'user'"><small>{{item.role === 'user' ? 'You' : 'Proto AI'}}</small><p>{{item.content}}</p></div>
      } @empty {
        <p class="muted">Ask AI to propose structure, tokens, variants or JSON. AI does not publish changes automatically.</p>
      }
    </div>
    <form (ngSubmit)="send()" class="inline-ai-compose">
      <textarea name="prompt" [(ngModel)]="prompt" rows="4" [placeholder]="placeholder"></textarea>
      <button class="primary" [disabled]="loading()">{{loading() ? 'Thinking…' : 'Ask AI'}}</button>
    </form>
  </aside>`
})
export class InlineAiComponent {
  @Input() title = 'Assistant';
  @Input() context = '';
  @Input() placeholder = 'Describe what you want to create…';
  private http = inject(HttpClient);
  prompt = '';
  sessionId?: string;
  loading = signal(false);
  messages = signal<{role: string; content: string}[]>([]);
  send() {
    const text = this.prompt.trim(); if (!text) return;
    this.messages.update(x => [...x, {role:'user', content:text}]); this.prompt=''; this.loading.set(true);
    const message = this.context ? `${this.context}\n\nAdmin request: ${text}` : text;
    this.http.post<any>('/api/ai/chat', {message, sessionId:this.sessionId}).subscribe({
      next: x => { this.sessionId=x.sessionId; this.messages.update(m=>[...m,{role:'assistant',content:x.message}]); this.loading.set(false); },
      error: () => { this.messages.update(m=>[...m,{role:'assistant',content:'AI integration is not configured or the request failed.'}]); this.loading.set(false); }
    });
  }
}
