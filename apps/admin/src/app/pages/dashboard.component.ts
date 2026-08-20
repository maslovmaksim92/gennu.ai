import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);

  protected readonly admins = signal(0);
  protected readonly users = signal(0);
  protected readonly themes = signal(0);
  protected readonly blocks = signal(0);

  public constructor() {
    forkJoin({
      a: this.http.get<any[]>('/api/admins'),
      u: this.http.get<any[]>('/api/users'),
      t: this.http.get<any[]>('/api/themes'),
      b: this.http.get<any[]>('/api/blocks'),
    }).subscribe((x) => {
      this.admins.set(x.a.length);
      this.users.set(x.u.length);
      this.themes.set(x.t.length);
      this.blocks.set(x.b.length);
    });
  }
}
