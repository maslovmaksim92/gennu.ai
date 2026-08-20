import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef } from 'ag-grid-community';
import { InlineAiComponent } from '../shared/inline-ai.component';

@Component({
  imports: [FormsModule, AgGridImports, InlineAiComponent],
  templateUrl: './blocks.component.html',
})
export class BlocksComponent {
  http = inject(HttpClient);
  rows = signal<any[]>([]);
  creating = signal(false);
  key = '';
  name = '';
  schema = '{"type":"object","properties":{"data":{"type":"object"},"settings":{"type":"object"}}}';
  cols: ColDef[] = [
    {
      field: 'name',
      flex: 1,
    },
    {
      field: 'key',
      flex: 1,
    },
    {
      field: 'version',
      width: 100,
    },
    {
      field: 'status',
      width: 140,
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      flex: 1,
    },
  ];
  constructor() {
    this.load();
  }
  load() {
    this.http.get<any[]>('/api/blocks').subscribe((x) => this.rows.set(x));
  }
  create() {
    let parsed = {};
    try {
      parsed = JSON.parse(this.schema);
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
}
