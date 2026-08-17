import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({
  standalone: true, imports: [
    RouterOutlet, RouterLink, RouterLinkActive
  ], templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
