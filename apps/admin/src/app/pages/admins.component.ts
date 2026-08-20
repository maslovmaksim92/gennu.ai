import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AtlasButtonDirective,
  AtlasControlDirective,
  AtlasDialogComponent,
  AtlasFieldComponent,
} from '@atlas/ui';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

interface AdminRow {
  id: string;
  email: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
  lastLoginAt: string | null;
  createdAt: string;
}

@Component({
  imports: [
    FormsModule,
    AgGridImports,
    AtlasButtonDirective,
    AtlasControlDirective,
    AtlasDialogComponent,
    AtlasFieldComponent,
  ],
  templateUrl: './admins.component.html',
})
export class AdminsComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<AdminRow[]>([]);
  protected readonly showInvite = signal(false);
  protected readonly editingAdmin = signal<AdminRow | null>(null);
  protected inviteEmail = '';
  protected readonly inviteToken = signal('');
  protected editEmail = '';
  protected editStatus: AdminRow['status'] = 'ACTIVE';
  protected readonly cols: ColDef<AdminRow>[] = [
    { field: 'email', flex: 1 },
    { field: 'status', width: 130 },
    { field: 'lastLoginAt', headerName: 'Last login', flex: 1 },
    { field: 'createdAt', headerName: 'Created', flex: 1 },
    {
      headerName: '',
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<AdminRow>) => this.createActions(params.data),
    },
  ];

  public constructor() {
    this.load();
  }

  protected invite(): void {
    this.http.post<any>('/api/admins/invite', { email: this.inviteEmail }).subscribe((x) => {
      this.inviteToken.set(x.inviteToken);
      this.inviteEmail = '';
      this.load();
    });
  }

  protected closeEdit(): void {
    this.editingAdmin.set(null);
  }

  protected saveEdit(): void {
    const admin = this.editingAdmin();
    if (!admin) return;

    this.http
      .patch<AdminRow>(`/api/admins/${admin.id}`, {
        email: this.editEmail.trim(),
        status: this.editStatus,
      })
      .subscribe(() => {
        this.closeEdit();
        this.load();
      });
  }

  private createActions(admin: AdminRow | undefined): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '6px';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'atlas-button';
    editButton.dataset.variant = 'secondary';
    editButton.dataset.size = 'sm';
    editButton.textContent = 'Edit';
    editButton.disabled = !admin;
    editButton.addEventListener('click', () => {
      if (admin) this.openEdit(admin);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !admin;
    deleteButton.addEventListener('click', () => {
      if (admin) this.remove(admin);
    });

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(admin: AdminRow): void {
    this.editEmail = admin.email;
    this.editStatus = admin.status;
    this.editingAdmin.set(admin);
  }

  private remove(admin: AdminRow): void {
    if (!window.confirm(`Delete administrator ${admin.email}?`)) return;
    this.http.delete(`/api/admins/${admin.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<AdminRow[]>('/api/admins').subscribe((rows) => this.rows.set(rows));
  }
}
