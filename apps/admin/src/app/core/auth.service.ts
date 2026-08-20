import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthUser } from '@atlas/contracts';
import { firstValueFrom } from 'rxjs';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

const tokenStorageKey = 'proto_admin_access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  public readonly user = signal<AuthUser | null>(null);
  public readonly loaded = signal(false);
  public readonly authenticated = computed(() => !!this.user());

  public async load(): Promise<AuthUser | null> {
    if (this.loaded()) {
      return this.user();
    }

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

  public async login(email: string, password: string): Promise<AuthUser> {
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

  public async logout(): Promise<void> {
    this.clearSession();
  }

  private clearSession(): void {
    sessionStorage.removeItem(tokenStorageKey);
    this.user.set(null);
  }
}

export function getAdminAccessToken(): string | null {
  return sessionStorage.getItem(tokenStorageKey);
}
