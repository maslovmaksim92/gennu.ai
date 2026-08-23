import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { tablePagination } from '../shared/table-pagination';
import { VersionPanelComponent } from '../shared/version-panel.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { TemplateRow } from './templates.types';

/**
 * Templates are the gate between the design system and generated sites: a
 * template version lists the exact BlockVersions a site pinned to it may use.
 * Everything about which blocks are allowed is edited in the shared version
 * panel, so this page stays a plain list plus lifecycle entry points.
 */
@Component({
  imports: [AtlasButtonDirective, DatePipe, FormsModule, TuiTable, TuiTablePagination],
  templateUrl: './templates.component.html',
})
export class TemplatesComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<TemplateRow[]>([]);
  protected readonly pagination = tablePagination(this.rows, 25);
  protected readonly creating = signal(false);
  protected readonly error = signal<string | null>(null);

  protected key = '';
  protected name = '';
  protected description = '';

  public constructor() {
    this.load();
  }

  protected allowedCount(template: TemplateRow): number {
    const allowed = template.schema?.allowedBlockVersionIds;
    return Array.isArray(allowed) ? allowed.length : 0;
  }

  protected toggleCreate(): void {
    this.creating.set(!this.creating());
    this.error.set(null);
  }

  protected create(): void {
    this.error.set(null);

    this.http
      .post('/api/templates', {
        key: this.key.trim(),
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        schema: { allowedBlockVersionIds: [] },
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.key = '';
          this.name = '';
          this.description = '';
          this.load();
        },
        error: (response: HttpErrorResponse) => this.error.set(this.messageOf(response)),
      });
  }

  protected openVersions(template: TemplateRow): void {
    this.dialogs
      .open<void>(new PolymorpheusComponent(VersionPanelComponent), {
        label: `Versions — ${template.name}`,
        size: 'l',
        data: { kind: 'templates', id: template.id, title: `${template.name} versions` },
      })
      .subscribe({ complete: () => this.load() });
  }

  protected remove(template: TemplateRow): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Delete template',
        size: 's',
        data: { message: `Delete template ${template.name}?`, confirmLabel: 'Delete' },
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.http.delete(`/api/templates/${template.id}`).subscribe({
          next: () => this.load(),
          error: (response: HttpErrorResponse) => this.error.set(this.messageOf(response)),
        });
      });
  }

  private load(): void {
    this.http.get<TemplateRow[]>('/api/templates').subscribe((rows) => this.rows.set(rows));
  }

  private messageOf(response: HttpErrorResponse): string {
    const message = response.error?.message;
    return Array.isArray(message) ? message.join(' ') : (message ?? 'Request failed.');
  }
}
