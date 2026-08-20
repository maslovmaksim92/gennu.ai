import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { TuiDialogService } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { InlineAiComponent } from '../shared/inline-ai.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditThemeDialogComponent } from './edit-theme-dialog.component';
import { ThemeRow } from './themes.types';

@Component({
  imports: [FormsModule, AgGridImports, InlineAiComponent, TuiTabs],
  templateUrl: './themes.component.html',
})
export class ThemesComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<ThemeRow[]>([]);
  protected readonly creating = signal(false);
  protected readonly createTabIndex = signal(0);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly imageName = signal<string | null>(null);
  protected key = '';
  protected name = '';
  protected schema = '{"colors":{},"typography":{},"spacing":{},"radius":{}}';
  protected readonly cols: ColDef<ThemeRow>[] = [
    { field: 'name', flex: 1 },
    { field: 'key', flex: 1 },
    { field: 'version', width: 100 },
    { field: 'status', width: 140 },
    { field: 'updatedAt', headerName: 'Updated', flex: 1 },
    {
      headerName: '',
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<ThemeRow>) => this.createActions(params.data),
    },
  ];

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

  private createActions(theme: ThemeRow | undefined): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '6px';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'atlas-button';
    editButton.dataset.variant = 'secondary';
    editButton.dataset.size = 'sm';
    editButton.textContent = 'Edit';
    editButton.disabled = !theme;
    editButton.addEventListener('click', () => {
      if (theme) {
        this.openEdit(theme);
      }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !theme || theme.status !== 'DRAFT';
    deleteButton.title = theme?.status === 'DRAFT' ? '' : 'Published history cannot be deleted';
    deleteButton.addEventListener('click', () => {
      if (theme?.status === 'DRAFT') {
        this.remove(theme);
      }
    });

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(theme: ThemeRow): void {
    this.dialogs
      .open<ThemeRow>(new PolymorpheusComponent(EditThemeDialogComponent), {
        label: 'Edit theme',
        size: 'l',
        data: theme,
      })
      .subscribe(() => this.load());
  }

  private remove(theme: ThemeRow): void {
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
