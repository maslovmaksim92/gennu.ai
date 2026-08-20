import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, type TuiDialogContext, TuiInput } from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { injectContext } from '@taiga-ui/polymorpheus';
import { forkJoin, of } from 'rxjs';
import { BlockRow } from './blocks.types';

@Component({
  imports: [FormsModule, TuiButton, TuiForm, TuiInput],
  templateUrl: './edit-block-dialog.component.html',
})
export class EditBlockDialogComponent {
  private readonly http = inject(HttpClient);

  protected readonly context = injectContext<TuiDialogContext<BlockRow, BlockRow>>();
  protected name = this.context.data.name;
  protected description = this.context.data.description ?? '';
  protected schema = JSON.stringify(this.context.data.schema ?? {}, null, 2);
  protected defaults = JSON.stringify(this.context.data.defaults ?? {}, null, 2);
  protected readonly canEditVersion = this.context.data.status === 'DRAFT' && !!this.context.data.versionId;
  protected saving = false;
  protected jsonError = '';

  protected cancel(): void {
    this.context.$implicit.complete();
  }

  protected save(): void {
    if (this.saving) {
      return;
    }

    let parsedSchema: Record<string, unknown> = this.context.data.schema ?? {};
    let parsedDefaults: Record<string, unknown> = this.context.data.defaults ?? {};
    if (this.canEditVersion) {
      try {
        parsedSchema = JSON.parse(this.schema) as Record<string, unknown>;
        parsedDefaults = JSON.parse(this.defaults) as Record<string, unknown>;
        this.jsonError = '';
      } catch {
        this.jsonError = 'Schema or defaults JSON is invalid.';
        return;
      }
    }

    this.saving = true;
    const definition$ = this.http.patch<BlockRow>(`/api/blocks/${this.context.data.id}`, {
      name: this.name.trim(),
      description: this.description.trim() || null,
    });
    const version$ =
      this.canEditVersion && this.context.data.versionId
        ? this.http.patch(`/api/blocks/versions/${this.context.data.versionId}`, {
            schema: parsedSchema,
            defaults: parsedDefaults,
          })
        : of(null);

    forkJoin([definition$, version$]).subscribe({
      next: () =>
        this.context.completeWith({
          ...this.context.data,
          name: this.name.trim(),
          description: this.description.trim() || null,
          schema: parsedSchema,
          defaults: parsedDefaults,
        }),
      error: () => {
        this.saving = false;
      },
    });
  }
}
