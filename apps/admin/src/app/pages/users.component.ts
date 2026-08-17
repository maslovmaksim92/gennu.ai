import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
@Component({
  standalone: true, imports: [
    AgGridAngular
  ], templateUrl: './users.component.html'
})
export class UsersComponent {
  http = inject(HttpClient);
  rows = signal<any[]>([]);
  cols: ColDef[] = [
    {
      field: 'email', flex: 1
    },
    {
      field: 'role', width: 120
    },
    {
      field: 'status', width: 130
    },
    {
      field: 'emailVerified', headerName: 'Verified', width: 120
    },
    {
      field: 'lastLoginAt', headerName: 'Last login', flex: 1
    },
    {
      field: 'createdAt', headerName: 'Created', flex: 1
    }
  ];
  constructor() {
    this.http.get<any[]>('/api/users').subscribe(x => this.rows.set(x));
  }
}
