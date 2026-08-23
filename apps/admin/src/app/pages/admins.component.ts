import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { tablePagination } from '../shared/table-pagination';
import { AdminInviteResult, AdminRow } from './admins.types';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditAdminDialogComponent } from './edit-admin-dialog.component';
import { InviteAdminDialogComponent } from './invite-admin-dialog.component';

@Component({
  imports: [AtlasButtonDirective, DatePipe, TuiTable, TuiTablePagination],
  templateUrl: './admins.component.html',
})
export class AdminsComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<AdminRow[]>([]);
  protected readonly inviteToken = signal('');
  protected readonly pagination = tablePagination(this.rows, 20);

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

  protected openEdit(admin: AdminRow): void {
    this.dialogs
      .open<AdminRow>(new PolymorpheusComponent(EditAdminDialogComponent), {
        label: 'Edit administrator',
        size: 's',
        data: admin,
      })
      .subscribe(() => this.load());
  }

  protected remove(admin: AdminRow): void {
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
