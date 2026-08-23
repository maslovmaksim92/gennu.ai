import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { tablePagination } from '../shared/table-pagination';
import { SiteListRow } from './site-editor.types';

@Component({
  imports: [DatePipe, RouterLink, TuiTable, TuiTablePagination],
  templateUrl: './sites.component.html',
})
export class SitesComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<SiteListRow[]>([]);
  protected readonly pagination = tablePagination(this.rows, 25);

  public constructor() {
    this.http.get<SiteListRow[]>('/api/sites').subscribe((rows) => this.rows.set(rows));
  }
}
