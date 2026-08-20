import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { UserRow } from './users.types';

@Component({
  imports: [AgGridImports],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

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
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<UserRow>) => this.createActions(params.data),
    },
  ];

  public constructor() {
    this.load();
  }

  private createActions(user: UserRow | undefined): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '6px';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'atlas-button';
    editButton.dataset.variant = 'secondary';
    editButton.dataset.size = 'sm';
    editButton.textContent = 'Edit';
    editButton.disabled = !user;
    editButton.addEventListener('click', () => {
      if (user) {
        this.openEdit(user);
      }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !user || user.role === 'ADMIN';
    deleteButton.addEventListener('click', () => {
      if (user) {
        this.remove(user);
      }
    });

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(user: UserRow): void {
    this.dialogs
      .open<UserRow>(new PolymorpheusComponent(EditUserDialogComponent), {
        label: 'Edit user',
        size: 's',
        data: user,
      })
      .subscribe(() => this.load());
  }

  private remove(user: UserRow): void {
    if (!window.confirm(`Delete user ${user.email}?`)) {
      return;
    }

    this.http.delete(`/api/users/${user.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<UserRow[]>('/api/users').subscribe((rows) => this.rows.set(rows));
  }
}
