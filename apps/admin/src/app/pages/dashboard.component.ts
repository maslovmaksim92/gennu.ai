import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
@Component({
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  http = inject(HttpClient);
  admins = signal(0);
  users = signal(0);
  themes = signal(0);
  blocks = signal(0);
  constructor() {
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
