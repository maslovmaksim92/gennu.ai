import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InlineAiComponent } from '../shared/inline-ai.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
@Component({
  standalone: true, imports: [
    FormsModule, AgGridAngular, InlineAiComponent
  ], templateUrl: './themes.component.html'
})
export class ThemesComponent {
  http = inject(HttpClient);
  rows = signal<any[]>([]);
  creating = signal(false);
  key = '';
  name = '';
  schema = '{"colors":{},"typography":{},"spacing":{},"radius":{}}';
  cols: ColDef[] = [
    {
      field: 'name', flex: 1
    },
    {
      field: 'key', flex: 1
    },
    {
      field: 'version', width: 100
    },
    {
      field: 'status', width: 140
    },
    {
      field: 'updatedAt', headerName: 'Updated', flex: 1
    }
  ];
  constructor() {
    this.load();
  }
  load() {
    this.http.get<any[]>('/api/themes').subscribe(x => this.rows.set(x));
  }
  create() {
    let parsed = {};
    try {
      parsed = JSON.parse(this.schema);
    }
    catch {
      return;
    }
    this.http.post('/api/themes', {
      key: this.key, name: this.name, schema: parsed
    }).subscribe(() => {
      this.creating.set(false);
      this.key = '';
      this.name = '';
      this.load();
    });
  }
}
