import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { InlineAiComponent } from '../shared/inline-ai.component';
import { BlockRow } from './blocks.types';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditBlockDialogComponent } from './edit-block-dialog.component';

@Component({
  imports: [FormsModule, AgGridImports, InlineAiComponent],
  templateUrl: './blocks.component.html',
})
export class BlocksComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<BlockRow[]>([]);
  protected readonly creating = signal(false);
  protected key = '';
  protected name = '';
  protected schema =
    '{"type":"object","properties":{"data":{"type":"object"},"settings":{"type":"object"}}}';
  protected readonly cols: ColDef<BlockRow>[] = [
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
      cellRenderer: (params: ICellRendererParams<BlockRow>) => this.createActions(params.data),
    },
  ];

  public constructor() {
    this.load();
  }

  protected create(): void {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(this.schema) as Record<string, unknown>;
    } catch {
      return;
    }

    this.http
      .post('/api/blocks', {
        key: this.key,
        name: this.name,
        schema: parsed,
      })
      .subscribe(() => {
        this.creating.set(false);
        this.key = '';
        this.name = '';
        this.load();
      });
  }

  private createActions(block: BlockRow | undefined): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '6px';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'atlas-button';
    editButton.dataset.variant = 'secondary';
    editButton.dataset.size = 'sm';
    editButton.textContent = 'Edit';
    editButton.disabled = !block;
    editButton.addEventListener('click', () => {
      if (block) {
        this.openEdit(block);
      }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !block || block.status !== 'DRAFT';
    deleteButton.title = block?.status === 'DRAFT' ? '' : 'Published history cannot be deleted';
    deleteButton.addEventListener('click', () => {
      if (block?.status === 'DRAFT') {
        this.remove(block);
      }
    });

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(block: BlockRow): void {
    this.dialogs
      .open<BlockRow>(new PolymorpheusComponent(EditBlockDialogComponent), {
        label: 'Edit block',
        size: 'l',
        data: block,
      })
      .subscribe(() => this.load());
  }

  private remove(block: BlockRow): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Delete block',
        size: 's',
        data: {
          message: `Delete block ${block.name}?`,
          confirmLabel: 'Delete',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.http.delete(`/api/blocks/${block.id}`).subscribe(() => this.load());
        }
      });
  }

  private load(): void {
    this.http.get<BlockRow[]>('/api/blocks').subscribe((rows) => this.rows.set(rows));
  }
}
