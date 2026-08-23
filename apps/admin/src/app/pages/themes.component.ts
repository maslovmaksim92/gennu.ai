import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiDialogService } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { tablePagination } from '../shared/table-pagination';
import { InlineAiComponent } from '../shared/inline-ai.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditThemeDialogComponent } from './edit-theme-dialog.component';
import { ThemeRow } from './themes.types';

@Component({
  imports: [
    AtlasButtonDirective,
    DatePipe,
    FormsModule,
    InlineAiComponent,
    TuiTable,
    TuiTablePagination,
    TuiTabs,
  ],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.scss',
})
export class ThemesComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<ThemeRow[]>([]);
  protected readonly pagination = tablePagination(this.rows, 25);
  protected readonly creating = signal(false);
  protected readonly createTabIndex = signal(0);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly imageName = signal<string | null>(null);
  protected key = '';
  protected name = '';
  protected schema = '{"colors":{},"typography":{},"spacing":{},"radius":{}}';
  public constructor() {
    this.load();
  }

  protected toggleCreate(): void {
    const next = !this.creating();
    this.creating.set(next);

    if (!next) {
      this.resetImage();
      this.createTabIndex.set(0);
    }
  }

  protected create(): void {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(this.schema) as Record<string, unknown>;
    } catch {
      return;
    }

    this.http
      .post('/api/themes', {
        key: this.key,
        name: this.name,
        schema: parsed,
      })
      .subscribe(() => {
        this.creating.set(false);
        this.key = '';
        this.name = '';
        this.resetImage();
        this.load();
      });
  }

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      this.resetImage();
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.imagePreview.set(typeof reader.result === 'string' ? reader.result : null);
      this.imageName.set(file.name);
    });
    reader.readAsDataURL(file);
  }

  protected resetImage(): void {
    this.imagePreview.set(null);
    this.imageName.set(null);
  }

  protected openEdit(theme: ThemeRow): void {
    this.dialogs
      .open<ThemeRow>(new PolymorpheusComponent(EditThemeDialogComponent), {
        label: 'Edit theme',
        size: 'l',
        data: theme,
      })
      .subscribe(() => this.load());
  }

  protected remove(theme: ThemeRow): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Delete theme',
        size: 's',
        data: {
          message: `Delete theme ${theme.name}?`,
          confirmLabel: 'Delete',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.http.delete(`/api/themes/${theme.id}`).subscribe(() => this.load());
        }
      });
  }

  private load(): void {
    this.http.get<ThemeRow[]>('/api/themes').subscribe((rows) => this.rows.set(rows));
  }
}
