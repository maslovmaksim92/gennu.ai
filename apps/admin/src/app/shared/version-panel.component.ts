import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtlasButtonDirective } from '@atlas/ui';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import type { Observable } from 'rxjs';
import type {
  BlockVersionOption,
  RenderCheck,
  VersionPanelData,
  VersionRow,
  VersionUsage,
} from './version-panel.types';

/**
 * The lifecycle screen shared by themes, blocks and templates.
 *
 * All three resources version the same way — a draft is editable, publishing
 * freezes it, deprecating retires it while pinned sites keep working — so the
 * admin shows one panel rather than three near-identical ones. Every rule it
 * appears to enforce is really enforced by the API; the panel only disables
 * what the API would refuse, so a stale screen cannot corrupt anything.
 */
@Component({
  selector: 'proto-version-panel',
  imports: [AtlasButtonDirective, DatePipe, FormsModule, TuiButton],
  templateUrl: './version-panel.component.html',
  styleUrl: './version-panel.component.scss',
})
export class VersionPanelComponent {
  private readonly http = inject(HttpClient);
  protected readonly context = injectContext<TuiDialogContext<void, VersionPanelData>>();

  protected readonly versions = signal<VersionRow[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly usage = signal<Record<string, VersionUsage>>({});
  protected readonly renderChecks = signal<Record<string, RenderCheck>>({});
  protected readonly catalog = signal<BlockVersionOption[]>([]);

  /** The draft currently open in the schema editor, if any. */
  protected readonly editingId = signal<string | null>(null);
  protected schemaDraft = '';
  protected changelogDraft = '';

  protected readonly creating = signal(false);
  protected newVersion = '';
  protected newChangelog = '';

  protected readonly kind = this.context.data.kind;
  protected readonly isTemplate = this.kind === 'templates';
  protected readonly isBlock = this.kind === 'blocks';

  protected readonly latest = computed(() => this.versions()[0] ?? null);

  public constructor() {
    this.load();

    if (this.isTemplate) {
      this.http
        .get<BlockVersionOption[]>('/api/blocks/version-catalog')
        .subscribe((rows) => this.catalog.set(rows));
    }
  }

  protected close(): void {
    this.context.completeWith();
  }

  /** Suggests the next patch version so the operator rarely types one. */
  protected suggestVersion(): string {
    const current = this.latest();

    if (!current) {
      return '1.0.0';
    }

    return `${current.major}.${current.minor}.${current.patch + 1}`;
  }

  protected toggleCreate(): void {
    const next = !this.creating();
    this.creating.set(next);

    if (next) {
      this.newVersion = this.suggestVersion();
      this.newChangelog = '';
    }
  }

  protected createVersion(): void {
    this.run(
      this.http.post(`/api/${this.kind}/${this.context.data.id}/versions`, {
        version: this.newVersion.trim(),
        changelog: this.newChangelog.trim() || undefined,
      }),
      () => {
        this.creating.set(false);
        this.newChangelog = '';
      },
    );
  }

  protected startEdit(version: VersionRow): void {
    this.editingId.set(version.id);
    this.schemaDraft = JSON.stringify(version.schema ?? {}, null, 2);
    this.changelogDraft = version.changelog ?? '';
    this.error.set(null);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected saveDraft(version: VersionRow): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(this.schemaDraft);
    } catch {
      this.error.set('Schema is not valid JSON.');
      return;
    }

    this.run(
      this.http.patch(`/api/${this.kind}/versions/${version.id}`, {
        schema: parsed,
        changelog: this.changelogDraft.trim() || null,
      }),
      () => this.editingId.set(null),
    );
  }

  /** Block versions currently allowed by the draft template schema being edited. */
  protected allowedIds(): string[] {
    try {
      const parsed = JSON.parse(this.schemaDraft) as { allowedBlockVersionIds?: unknown };
      return Array.isArray(parsed.allowedBlockVersionIds)
        ? (parsed.allowedBlockVersionIds as string[])
        : [];
    } catch {
      return [];
    }
  }

  protected isAllowed(blockVersionId: string): boolean {
    return this.allowedIds().includes(blockVersionId);
  }

  /**
   * Writes the pick back into the JSON the operator can also edit by hand.
   *
   * The textarea stays the single source of truth so the two never disagree.
   */
  protected toggleAllowed(blockVersionId: string): void {
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(this.schemaDraft) as Record<string, unknown>;
    } catch {
      this.error.set('Fix the JSON before picking blocks.');
      return;
    }

    const current = this.allowedIds();
    const next = current.includes(blockVersionId)
      ? current.filter((id) => id !== blockVersionId)
      : [...current, blockVersionId];

    parsed['allowedBlockVersionIds'] = next;
    this.schemaDraft = JSON.stringify(parsed, null, 2);
    this.error.set(null);
  }

  protected publish(version: VersionRow): void {
    this.run(this.http.post(`/api/${this.kind}/versions/${version.id}/publish`, {}));
  }

  protected deprecate(version: VersionRow): void {
    this.run(this.http.post(`/api/${this.kind}/versions/${version.id}/deprecate`, {}));
  }

  protected loadUsage(version: VersionRow): void {
    this.http
      .get<VersionUsage>(`/api/${this.kind}/versions/${version.id}/usage`)
      .subscribe((result) => this.usage.update((all) => ({ ...all, [version.id]: result })));
  }

  protected loadRenderCheck(version: VersionRow): void {
    this.http
      .get<RenderCheck>(`/api/blocks/versions/${version.id}/render-check`)
      .subscribe((result) => this.renderChecks.update((all) => ({ ...all, [version.id]: result })));
  }

  private load(): void {
    this.http
      .get<VersionRow[]>(`/api/${this.kind}/${this.context.data.id}/versions`)
      .subscribe((rows) => this.versions.set(rows));
  }

  private run(request: Observable<unknown>, onDone?: () => void): void {
    this.busy.set(true);
    this.error.set(null);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        onDone?.();
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
