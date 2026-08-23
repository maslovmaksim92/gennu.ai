import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { tablePagination } from '../shared/table-pagination';
import { InlineAiComponent } from '../shared/inline-ai.component';
import { BlockRow } from './blocks.types';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditBlockDialogComponent } from './edit-block-dialog.component';

@Component({
  imports: [
    AtlasButtonDirective,
    DatePipe,
    FormsModule,
    InlineAiComponent,
    TuiTable,
    TuiTablePagination,
  ],
  templateUrl: './blocks.component.html',
})
export class BlocksComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<BlockRow[]>([]);
  protected readonly pagination = tablePagination(this.rows, 25);
  protected readonly creating = signal(false);
  protected key = '';
  protected name = '';
  protected schema =
    '{"type":"object","properties":{"data":{"type":"object"},"settings":{"type":"object"}}}';
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

  protected openEdit(block: BlockRow): void {
    this.dialogs
      .open<BlockRow>(new PolymorpheusComponent(EditBlockDialogComponent), {
        label: 'Edit block',
        size: 'l',
        data: block,
      })
      .subscribe(() => this.load());
  }

  protected remove(block: BlockRow): void {
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
