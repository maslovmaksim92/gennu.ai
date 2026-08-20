import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

@Component({
  imports: [AgGridImports],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<UserRow[]>([]);
  protected readonly cols: ColDef<UserRow>[] = [
    { field: 'email', flex: 1 },
    { field: 'role', width: 120 },
    { field: 'status', width: 130 },
    { field: 'emailVerified', headerName: 'Verified', width: 120 },
    { field: 'lastLoginAt', headerName: 'Last login', flex: 1 },
    { field: 'createdAt', headerName: 'Created', flex: 1 },
    {
      headerName: '',
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<UserRow>) => this.createDeleteButton(params.data),
    },
  ];

  public constructor() {
    this.load();
  }

  private createDeleteButton(user: UserRow | undefined): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atlas-button';
    button.dataset.variant = 'danger';
    button.dataset.size = 'sm';
    button.textContent = 'Delete';
    button.disabled = !user || user.role === 'ADMIN';
    button.addEventListener('click', () => {
      if (user) this.remove(user);
    });
    return button;
  }

  private remove(user: UserRow): void {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    this.http.delete(`/api/users/${user.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<UserRow[]>('/api/users').subscribe((rows) => this.rows.set(rows));
  }
}
