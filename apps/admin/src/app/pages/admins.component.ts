import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AtlasButtonDirective } from '@atlas/ui';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AdminInviteResult, AdminRow } from './admins.types';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditAdminDialogComponent } from './edit-admin-dialog.component';
import { InviteAdminDialogComponent } from './invite-admin-dialog.component';

@Component({
  imports: [AgGridImports, AtlasButtonDirective],
  templateUrl: './admins.component.html',
})
export class AdminsComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<AdminRow[]>([]);
  protected readonly inviteToken = signal('');
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

  protected openInvite(): void {
    this.dialogs
      .open<AdminInviteResult>(new PolymorpheusComponent(InviteAdminDialogComponent), {
        label: 'Add administrator',
        size: 's',
      })
      .subscribe((result) => {
        this.inviteToken.set(result.inviteToken);
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
    editButton.addEventListener('click', () => admin && this.openEdit(admin));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'atlas-button';
    deleteButton.dataset.variant = 'danger';
    deleteButton.dataset.size = 'sm';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = !admin;
    deleteButton.addEventListener('click', () => admin && this.remove(admin));

    container.append(editButton, deleteButton);
    return container;
  }

  private openEdit(admin: AdminRow): void {
    this.dialogs
      .open<AdminRow>(new PolymorpheusComponent(EditAdminDialogComponent), {
        label: 'Edit administrator',
        size: 's',
        data: admin,
      })
      .subscribe(() => this.load());
  }

  private remove(admin: AdminRow): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Delete administrator',
        size: 's',
        data: { message: `Delete administrator ${admin.email}?` },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.http.delete(`/api/admins/${admin.id}`).subscribe(() => this.load());
        }
      });
  }

  private load(): void {
    this.http.get<AdminRow[]>('/api/admins').subscribe((rows) => this.rows.set(rows));
  }
}
