import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.error.set('Invalid email or password');
    } finally {
      this.loading.set(false);
    }
  }
}
