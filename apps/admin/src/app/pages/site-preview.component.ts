import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { AtlasButtonDirective } from '@atlas/ui';
import type {
  PreviewTokenResponse,
  PreviewViewport,
  RenderIssueRow,
  SitePageRow,
  SiteRow,
} from './site-preview.types';

const VIEWPORT_WIDTH: Record<PreviewViewport, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

/**
 * Renders a generated site inside a sandboxed iframe.
 *
 * The iframe loads `/api/render/preview/<token>` rather than an admin route,
 * because an iframe cannot attach the admin `Authorization` header. The token
 * is short-lived and scoped to a single site.
 */
@Component({
  selector: 'proto-site-preview',
  imports: [AtlasButtonDirective],
  templateUrl: './site-preview.component.html',
  styleUrl: './site-preview.component.scss',
})
export class SitePreviewComponent {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  /** Set right after a generation to preview the new site immediately. */
  public readonly siteId = input<string | null>(null);

  protected readonly sites = signal<SiteRow[]>([]);
  protected readonly pages = signal<SitePageRow[]>([]);
  protected readonly issues = signal<RenderIssueRow[]>([]);
  protected readonly selectedSiteId = signal<string>('');
  protected readonly selectedSlug = signal<string>('');
  protected readonly viewport = signal<PreviewViewport>('desktop');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly previewToken = signal<string | null>(null);

  protected readonly frameWidth = computed(() => VIEWPORT_WIDTH[this.viewport()]);
  protected readonly selectedSite = computed(() =>
    this.sites().find((site) => site.id === this.selectedSiteId()),
  );

  protected readonly frameUrl = computed<SafeResourceUrl | null>(() => {
    const token = this.previewToken();
    if (!token) {
      return null;
    }

    const slug = this.selectedSlug();
    const url = slug
      ? `/api/render/preview/${token}?page=${encodeURIComponent(slug)}`
      : `/api/render/preview/${token}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  public constructor() {
    this.loadSites();

    effect(() => {
      const incoming = this.siteId();
      if (incoming && incoming !== this.selectedSiteId()) {
        this.loadSites(incoming);
      }
    });
  }

  protected selectSite(siteId: string): void {
    this.selectedSiteId.set(siteId);
    this.selectedSlug.set('');
    this.previewToken.set(null);

    if (siteId) {
      this.loadPages(siteId);
      this.refreshToken(siteId);
    }
  }

  protected selectPage(slug: string): void {
    this.selectedSlug.set(slug);
  }

  protected setViewport(value: PreviewViewport): void {
    this.viewport.set(value);
  }

  /** Preview tokens expire; this re-mints one without leaving the page. */
  protected reload(): void {
    const siteId = this.selectedSiteId();
    if (siteId) {
      this.refreshToken(siteId);
    }
  }

  private loadSites(preferredSiteId?: string): void {
    this.http.get<SiteRow[]>('/api/sites').subscribe({
      next: (sites) => {
        this.sites.set(sites);
        const next = preferredSiteId ?? this.selectedSiteId() ?? sites[0]?.id ?? '';
        if (next) {
          this.selectSite(next);
        }
      },
      error: (error) => this.error.set(this.errorMessage(error)),
    });
  }

  private loadPages(siteId: string): void {
    this.http.get<{ pages: SitePageRow[] }>(`/api/sites/${siteId}`).subscribe({
      next: (site) => this.pages.set(site.pages ?? []),
      error: (error) => this.error.set(this.errorMessage(error)),
    });

    this.http.get<{ issues: RenderIssueRow[] }>(`/api/render/sites/${siteId}/issues`).subscribe({
      next: (result) => this.issues.set(result.issues ?? []),
      error: () => this.issues.set([]),
    });
  }

  private refreshToken(siteId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http
      .post<PreviewTokenResponse>(`/api/render/sites/${siteId}/preview-token`, {})
      .subscribe({
        next: (response) => {
          this.previewToken.set(response.token);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(this.errorMessage(error));
          this.loading.set(false);
        },
      });
  }

  private errorMessage(error: any): string {
    const message = error?.error?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return typeof message === 'string' ? message : 'Request failed.';
  }
}
