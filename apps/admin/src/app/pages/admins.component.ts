import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';
import { AgGridImports } from '@atlas/ui-ag-grid';
import { ColDef } from 'ag-grid-community';

@Component({
  standalone: true,
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

  protected readonly rows = signal<any[]>([]);
  protected readonly showInvite = signal(false);
  protected inviteEmail = '';
  protected readonly inviteToken = signal('');
  protected readonly cols: ColDef[] = [
    { field: 'email', flex: 1 },
    { field: 'status', width: 130 },
    { field: 'lastLoginAt', headerName: 'Last login', flex: 1 },
    { field: 'createdAt', headerName: 'Created', flex: 1 },
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

  private load(): void {
    this.http.get<any[]>('/api/admins').subscribe((x) => this.rows.set(x));
  }
}
