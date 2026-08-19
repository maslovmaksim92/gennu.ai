import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
@Component({
  standalone: true,
  imports: [FormsModule, AgGridAngular],
  templateUrl: './admins.component.html',
})
export class AdminsComponent {
  http = inject(HttpClient);
  rows = signal<any[]>([]);
  showInvite = signal(false);
  inviteEmail = '';
  inviteToken = signal('');
  cols: ColDef[] = [
    {
      field: 'email',
      flex: 1,
    },
    {
      field: 'status',
      width: 130,
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
  load() {
    this.http.get<any[]>('/api/admins').subscribe((x) => this.rows.set(x));
  }
  invite() {
    this.http
      .post<any>('/api/admins/invite', {
        email: this.inviteEmail,
      })
      .subscribe((x) => {
        this.inviteToken.set(x.inviteToken);
        this.inviteEmail = '';
        this.load();
      });
  }
}
