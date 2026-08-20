import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef } from 'ag-grid-community';

@Component({
  imports: [AgGridImports],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<any[]>([]);
  protected readonly cols: ColDef[] = [
    {
      field: 'email',
      flex: 1,
    },
    {
      field: 'role',
      width: 120,
    },
    {
      field: 'status',
      width: 130,
    },
    {
      field: 'emailVerified',
      headerName: 'Verified',
      width: 120,
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last login',
      flex: 1,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
    },
  ];

  constructor() {
    this.load();
  }

  private load(): void {
    this.http.get<any[]>('/api/users').subscribe((rows) => this.rows.set(rows));
  }
}
