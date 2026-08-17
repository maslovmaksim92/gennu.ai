import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({
  standalone: true, imports: [
    FormsModule
  ], templateUrl: './login.component.html'
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/dashboard');
    }
    catch {
      this.error.set('Invalid email or password');
    }
    finally {
      this.loading.set(false);
    }
  }
}
