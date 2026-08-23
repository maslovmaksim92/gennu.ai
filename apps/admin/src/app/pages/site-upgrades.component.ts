import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import type { Observable } from 'rxjs';
import type {
  BlockUpgrade,
  BlockUpgradePreview,
  SiteUpgradesData,
  UpgradeOverview,
} from './site-upgrades.types';

/**
 * The one place where a site changes the versions it is pinned to.
 *
 * Content editing can never move a pin, so upgrades live here and always show
 * their consequences first: how many block instances are affected and which
 * fields the new version drops. The chain the API enforces is visible in the
 * screen itself — a block version the template has not approved is listed but
 * cannot be applied until a template version that allows it is published and
 * the site repinned.
 */
@Component({
  selector: 'proto-site-upgrades',
  imports: [AtlasButtonDirective, FormsModule, TuiButton],
  templateUrl: './site-upgrades.component.html',
  styleUrl: './site-upgrades.component.scss',
})
export class SiteUpgradesComponent {
  private readonly http = inject(HttpClient);
  protected readonly context = injectContext<TuiDialogContext<boolean, SiteUpgradesData>>();

  protected readonly overview = signal<UpgradeOverview | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly previews = signal<Record<string, BlockUpgradePreview>>({});

  /** Chosen target version per section, keyed by the current version id. */
  protected readonly choice = signal<Record<string, string>>({});

  /** Set once anything actually changed, so the editor knows to reload. */
  private changed = false;

  public constructor() {
    this.load();
  }

  protected close(): void {
    this.context.completeWith(this.changed);
  }

  protected pick(key: string, value: string): void {
    this.choice.update((all) => ({ ...all, [key]: value }));
  }

  protected chosen(key: string): string {
    return this.choice()[key] ?? '';
  }

  protected applyTheme(): void {
    const theme = this.overview()?.theme;
    const target = this.chosen('theme');

    if (!theme || !target) {
      return;
    }

    this.run(
      this.http.patch(`/api/sites/${this.context.data.siteId}`, { themeVersionId: target }),
      'Theme repinned.',
    );
  }

  protected applyTemplate(): void {
    const target = this.chosen('template');

    if (!target) {
      return;
    }

    this.run(
      this.http.post(`/api/sites/${this.context.data.siteId}/upgrades/template`, {
        templateVersionId: target,
      }),
      'Template repinned.',
    );
  }

  protected previewBlock(block: BlockUpgrade): void {
    const target = this.chosen(block.blockVersionId);

    if (!target) {
      return;
    }

    this.error.set(null);

    this.http
      .post<BlockUpgradePreview>(`/api/sites/${this.context.data.siteId}/upgrades/blocks/preview`, {
        fromBlockVersionId: block.blockVersionId,
        toBlockVersionId: target,
      })
      .subscribe({
        next: (preview) =>
          this.previews.update((all) => ({ ...all, [block.blockVersionId]: preview })),
        error: (response: HttpErrorResponse) => this.error.set(this.messageOf(response)),
      });
  }

  protected applyBlock(block: BlockUpgrade): void {
    const target = this.chosen(block.blockVersionId);

    if (!target) {
      return;
    }

    this.run(
      this.http.post(`/api/sites/${this.context.data.siteId}/upgrades/blocks`, {
        fromBlockVersionId: block.blockVersionId,
        toBlockVersionId: target,
      }),
      `${block.key} repinned on ${block.instanceCount} block(s).`,
    );
  }

  /** True when the chosen target is one the template has not approved. */
  protected blockedByTemplate(block: BlockUpgrade): boolean {
    const target = this.chosen(block.blockVersionId);
    return block.available.some(
      (candidate) => candidate.id === target && candidate.allowedByTemplate === false,
    );
  }

  private load(): void {
    this.http.get<UpgradeOverview>(`/api/sites/${this.context.data.siteId}/upgrades`).subscribe({
      next: (overview) => this.overview.set(overview),
      error: (response: HttpErrorResponse) => this.error.set(this.messageOf(response)),
    });
  }

  private run(request: Observable<unknown>, message: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.changed = true;
        this.notice.set(message);
        this.previews.set({});
        this.choice.set({});
        this.load();
      },
      error: (response: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(this.messageOf(response));
      },
    });
  }

  private messageOf(response: HttpErrorResponse): string {
    const message = response.error?.message;
    return Array.isArray(message) ? message.join(' ') : (message ?? 'Request failed.');
  }
}
