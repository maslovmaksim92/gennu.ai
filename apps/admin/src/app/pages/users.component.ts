import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { tablePagination } from '../shared/table-pagination';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { UserRow } from './users.types';

@Component({
  imports: [AtlasButtonDirective, DatePipe, TuiTable, TuiTablePagination],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly rows = signal<UserRow[]>([]);
  protected readonly pagination = tablePagination(this.rows, 25);

  public constructor() {
    this.load();
  }

  protected openEdit(user: UserRow): void {
    this.dialogs
      .open<UserRow>(new PolymorpheusComponent(EditUserDialogComponent), {
        label: 'Edit user',
        size: 's',
        data: user,
      })
      .subscribe(() => this.load());
  }

  protected remove(user: UserRow): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Delete user',
        size: 's',
        data: { message: `Delete user ${user.email}?` },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.http.delete(`/api/users/${user.id}`).subscribe(() => this.load());
        }
      });
  }

  private load(): void {
    this.http.get<UserRow[]>('/api/users').subscribe((rows) => this.rows.set(rows));
  }
}
