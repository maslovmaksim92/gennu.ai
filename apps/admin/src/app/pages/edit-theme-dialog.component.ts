import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, type TuiDialogContext, TuiInput } from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { injectContext } from '@taiga-ui/polymorpheus';
import { forkJoin, of } from 'rxjs';
import { ThemeRow } from './themes.types';

@Component({
  imports: [FormsModule, TuiButton, TuiForm, TuiInput],
  templateUrl: './edit-theme-dialog.component.html',
})
export class EditThemeDialogComponent {
  private readonly http = inject(HttpClient);

  protected readonly context = injectContext<TuiDialogContext<ThemeRow, ThemeRow>>();
  protected name = this.context.data.name;
  protected description = this.context.data.description ?? '';
  protected schema = JSON.stringify(this.context.data.schema ?? {}, null, 2);
  protected readonly canEditSchema = this.context.data.status === 'DRAFT' && !!this.context.data.versionId;
  protected saving = false;
  protected schemaError = '';

  protected cancel(): void {
    this.context.$implicit.complete();
  }

  protected save(): void {
    if (this.saving) {
      return;
    }

    let parsedSchema: Record<string, unknown> = this.context.data.schema ?? {};
    if (this.canEditSchema) {
      try {
        parsedSchema = JSON.parse(this.schema) as Record<string, unknown>;
        this.schemaError = '';
      } catch {
        this.schemaError = 'Theme JSON is invalid.';
        return;
      }
    }

    this.saving = true;
    const definition$ = this.http.patch<ThemeRow>(`/api/themes/${this.context.data.id}`, {
      name: this.name.trim(),
      description: this.description.trim() || null,
    });
    const version$ =
      this.canEditSchema && this.context.data.versionId
        ? this.http.patch(`/api/themes/versions/${this.context.data.versionId}`, { schema: parsedSchema })
        : of(null);

    forkJoin([definition$, version$]).subscribe({
      next: () => this.context.completeWith({ ...this.context.data, name: this.name.trim(), description: this.description.trim() || null, schema: parsedSchema }),
      error: () => {
        this.saving = false;
      },
    });
  }
}
