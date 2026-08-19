import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasBadgeComponent, AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';

@Component({
  standalone: true,
  imports: [FormsModule, AtlasBadgeComponent, AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent],
  templateUrl: './integrations.component.html',
})
export class IntegrationsComponent {
  http = inject(HttpClient);
  openaiKey = '';
  openaiModel = 'gpt-5.6-terra';
  openaiConnected = signal(false);

  constructor() {
    this.http.get<any[]>('/api/integrations').subscribe((x) =>
      this.openaiConnected.set(x.some((i) => i.provider === 'OPENAI' && i.hasSecret)),
    );
  }

  saveOpenAI() {
    this.http.put('/api/integrations/OPENAI', {
      name: 'OpenAI',
      status: 'CONNECTED',
      secret: this.openaiKey,
      config: { model: this.openaiModel },
    }).subscribe(() => {
      this.openaiKey = '';
      this.openaiConnected.set(true);
    });
  }
}
