import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

interface AdminRow {
  id: string;
  email: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

@Component({
  imports: [
    FormsModule,
    AgGridImports,
    AtlasButtonDirective,
    AtlasControlDirective,
    AtlasFieldComponent,
  ],
  templateUrl: './admins.component.html',
})
export class AdminsComponent {
  private readonly http = inject(HttpClient);

  protected readonly rows = signal<AdminRow[]>([]);
  protected readonly showInvite = signal(false);
  protected inviteEmail = '';
  protected readonly inviteToken = signal('');
  protected readonly cols: ColDef<AdminRow>[] = [
    { field: 'email', flex: 1 },
    { field: 'status', width: 130 },
    { field: 'lastLoginAt', headerName: 'Last login', flex: 1 },
    { field: 'createdAt', headerName: 'Created', flex: 1 },
    {
      headerName: '',
      width: 110,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<AdminRow>) => this.createDeleteButton(params.data),
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

  private createDeleteButton(admin: AdminRow | undefined): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atlas-button';
    button.dataset.variant = 'danger';
    button.dataset.size = 'sm';
    button.textContent = 'Delete';
    button.disabled = !admin;
    button.addEventListener('click', () => {
      if (admin) this.remove(admin);
    });
    return button;
  }

  private remove(admin: AdminRow): void {
    if (!window.confirm(`Delete administrator ${admin.email}?`)) return;
    this.http.delete(`/api/admins/${admin.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<AdminRow[]>('/api/admins').subscribe((rows) => this.rows.set(rows));
  }
}
