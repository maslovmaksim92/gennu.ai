import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AtlasBadgeComponent,
  AtlasButtonDirective,
  AtlasControlDirective,
  AtlasFieldComponent,
} from '@atlas/ui';

@Component({
  imports: [
    FormsModule,
    AtlasBadgeComponent,
    AtlasButtonDirective,
    AtlasControlDirective,
    AtlasFieldComponent,
  ],
  templateUrl: './integrations.component.html',
})
export class IntegrationsComponent {
  private readonly http = inject(HttpClient);

  protected openaiKey = '';
  protected openaiModel = 'gpt-5.6-terra';
  protected readonly openaiConnected = signal(false);

  public constructor() {
    this.http
      .get<any[]>('/api/integrations')
      .subscribe((x) =>
        this.openaiConnected.set(x.some((i) => i.provider === 'OPENAI' && i.hasSecret)),
      );
  }

  protected saveOpenAI(): void {
    this.http
      .put('/api/integrations/OPENAI', {
        name: 'OpenAI',
        status: 'CONNECTED',
        secret: this.openaiKey,
        config: { model: this.openaiModel },
      })
      .subscribe(() => {
        this.openaiKey = '';
        this.openaiConnected.set(true);
      });
  }
}
