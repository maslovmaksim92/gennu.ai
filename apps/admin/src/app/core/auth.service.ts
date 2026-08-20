import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AuthUser } from '@atlas/contracts';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

const tokenStorageKey = 'proto_admin_access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  user = signal<AuthUser | null>(null);
  loaded = signal(false);
  authenticated = computed(() => !!this.user());

  async load() {
    if (this.loaded()) return this.user();
    if (!sessionStorage.getItem(tokenStorageKey)) {
      this.loaded.set(true);
      return null;
    }

    try {
      this.user.set(await firstValueFrom(this.http.get<AuthUser>('/api/auth/me')));
    } catch {
      this.clearSession();
    } finally {
      this.loaded.set(true);
    }

    return this.user();
  }

  async login(email: string, password: string) {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      }),
    );

    sessionStorage.setItem(tokenStorageKey, response.token);
    this.user.set(response.user);
    this.loaded.set(true);
    return response.user;
  }

  async logout() {
    this.clearSession();
  }

  private clearSession() {
    sessionStorage.removeItem(tokenStorageKey);
    this.user.set(null);
  }
}

export function getAdminAccessToken(): string | null {
  return sessionStorage.getItem(tokenStorageKey);
}
