import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { TuiButton, TuiDialog, TuiInput } from '@taiga-ui/core';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

@Component({
  imports: [
    FormsModule,
    AgGridImports,
    AtlasControlDirective,
    AtlasFieldComponent,
    TuiButton,
    TuiDialog,
    TuiInput,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<UserRow[]>([]);
  protected readonly editingUser = signal<UserRow | null>(null);
  protected editDialogOpen = false;
  protected editEmail = '';
  protected editStatus: UserRow['status'] = 'ACTIVE';
  protected editEmailVerified = false;
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

  protected closeEdit(): void {
    this.editDialogOpen = false;
    this.editingUser.set(null);
  }

  protected saveEdit(): void {
    const user = this.editingUser();
    if (!user) return;

    this.http
      .patch<UserRow>(`/api/users/${user.id}`, {
        email: this.editEmail.trim(),
        status: this.editStatus,
        emailVerified: this.editEmailVerified,
      })
      .subscribe(() => {
        this.closeEdit();
        this.load();
      });
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
      if (user) this.openEdit(user);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !user || user.role === 'ADMIN';
    deleteButton.addEventListener('click', () => {
      if (user) this.remove(user);
    });

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(user: UserRow): void {
    this.editEmail = user.email;
    this.editStatus = user.status;
    this.editEmailVerified = user.emailVerified;
    this.editingUser.set(user);
    this.editDialogOpen = true;
  }

  private remove(user: UserRow): void {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    this.http.delete(`/api/users/${user.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<UserRow[]>('/api/users').subscribe((rows) => this.rows.set(rows));
  }
}
