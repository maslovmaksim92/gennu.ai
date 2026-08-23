import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent } from '@atlas/ui';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import type {
  BlockField,
  BlockInstanceRow,
  PageRow,
  PaletteEntry,
  SiteDetail,
} from './site-editor.types';

interface PreviewTokenResponse {
  token: string;
}

/**
 * Editor for a generated site.
 *
 * Every mutation goes through the API and the whole site is re-read
 * afterwards. That is deliberate: the API owns the invariants (slug
 * uniqueness, the template's block allowlist, sort order), so the screen
 * always shows what was actually stored rather than an optimistic guess.
 */
@Component({
  selector: 'proto-site-editor',
  imports: [
    AtlasButtonDirective,
    AtlasControlDirective,
    AtlasFieldComponent,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './site-editor.component.html',
  styleUrl: './site-editor.component.scss',
})
export class SiteEditorComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogs = inject(TuiDialogService);

  protected readonly siteId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly site = signal<SiteDetail | null>(null);
  protected readonly palette = signal<PaletteEntry[]>([]);
  protected readonly selectedPageId = signal<string>('');
  protected readonly selectedBlockId = signal<string>('');
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly addingPage = signal(false);

  protected newPageName = '';
  protected newPageSlug = '';

  /** Working copy of the selected block's data, saved on demand. */
  private readonly draft = signal<Record<string, unknown>>({});
  private readonly previewToken = signal<string>('');
  private readonly previewNonce = signal(0);

  protected readonly page = computed<PageRow | null>(
    () => this.site()?.pages.find((item) => item.id === this.selectedPageId()) ?? null,
  );

  protected readonly block = computed<BlockInstanceRow | null>(
    () => this.page()?.blocks.find((item) => item.id === this.selectedBlockId()) ?? null,
  );

  protected readonly fields = computed<BlockField[]>(
    () => this.block()?.blockVersion.schema?.fields ?? [],
  );

  protected readonly frameUrl = computed<SafeResourceUrl | null>(() => {
    const token = this.previewToken();
    const slug = this.page()?.slug;

    if (!token || !slug) {
      return null;
    }

    const url = `/api/render/preview/${token}?page=${encodeURIComponent(slug)}&r=${this.previewNonce()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  public constructor() {
    this.load();
    this.http.get<PaletteEntry[]>(`/api/sites/${this.siteId}/palette`).subscribe({
      next: (entries) => this.palette.set(entries),
      error: () => this.palette.set([]),
    });
    this.refreshPreviewToken();
  }

  protected selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
    this.selectBlock(this.page()?.blocks[0]?.id ?? '');
    this.previewNonce.update((value) => value + 1);
  }

  protected selectBlock(blockId: string): void {
    this.selectedBlockId.set(blockId);
    this.draft.set(structuredClone(this.block()?.data ?? {}));
    this.dirty.set(false);
  }

  // --- field values -------------------------------------------------------

  protected value(key: string): any {
    return this.draft()[key] ?? '';
  }

  protected setValue(key: string, value: unknown): void {
    this.draft.update((data) => ({ ...data, [key]: value }));
    this.dirty.set(true);
  }

  protected items(key: string): any[] {
    const value = this.draft()[key];
    return Array.isArray(value) ? value : [];
  }

  protected itemValue(key: string, index: number, subKey: string): any {
    return (this.items(key)[index] as Record<string, unknown>)?.[subKey] ?? '';
  }

  protected setItemValue(key: string, index: number, subKey: string, value: unknown): void {
    const next = this.items(key).map((item, position) =>
      position === index ? { ...(item as object), [subKey]: value } : item,
    );
    this.setValue(key, next);
  }

  protected addItem(field: BlockField): void {
    const empty: Record<string, unknown> = {};
    for (const sub of field.fields ?? []) {
      empty[sub.key] = sub.type === 'boolean' ? false : sub.type === 'number' ? 0 : '';
    }
    this.setValue(field.key, [...this.items(field.key), empty]);
  }

  protected removeItem(key: string, index: number): void {
    this.setValue(
      key,
      this.items(key).filter((_, position) => position !== index),
    );
  }

  protected moveItem(key: string, index: number, offset: number): void {
    const items = [...this.items(key)];
    const target = index + offset;

    if (target < 0 || target >= items.length) {
      return;
    }

    [items[index], items[target]] = [items[target], items[index]];
    this.setValue(key, items);
  }

  // --- mutations ----------------------------------------------------------

  protected saveBlock(): void {
    const block = this.block();

    if (!block || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.http.patch(`/api/block-instances/${block.id}`, { data: this.draft() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dirty.set(false);
        this.load();
      },
      error: (error) => this.fail(error),
    });
  }

  protected addBlock(entry: PaletteEntry): void {
    const page = this.page();

    if (!page) {
      return;
    }

    this.http
      .post<PageRow>(`/api/pages/${page.id}/blocks`, { blockVersionId: entry.blockVersionId })
      .subscribe({
        next: (updated) => this.load(updated.blocks[updated.blocks.length - 1]?.id),
        error: (error) => this.fail(error),
      });
  }

  protected moveBlock(index: number, offset: number): void {
    const page = this.page();

    if (!page) {
      return;
    }

    const ids = page.blocks.map((block) => block.id);
    const target = index + offset;

    if (target < 0 || target >= ids.length) {
      return;
    }

    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.http.post(`/api/pages/${page.id}/blocks/reorder`, { ids }).subscribe({
      next: () => this.load(this.selectedBlockId()),
      error: (error) => this.fail(error),
    });
  }

  protected removeBlock(block: BlockInstanceRow): void {
    this.confirm(`Remove the ${block.blockVersion.blockDefinition.name} block?`, () =>
      this.http
        .delete(`/api/block-instances/${block.id}`)
        .subscribe({ next: () => this.load(), error: (error) => this.fail(error) }),
    );
  }

  protected toggleAddPage(): void {
    this.addingPage.update((value) => !value);
    this.newPageName = '';
    this.newPageSlug = '';
    this.error.set(null);
  }

  protected createPage(): void {
    this.http
      .post<PageRow>(`/api/sites/${this.siteId}/pages`, {
        name: this.newPageName.trim(),
        slug: this.newPageSlug.trim(),
      })
      .subscribe({
        next: (created) => {
          this.addingPage.set(false);
          this.load(undefined, created.id);
        },
        error: (error) => this.fail(error),
      });
  }

  protected renamePage(page: PageRow, name: string, slug: string): void {
    this.http
      .patch(`/api/pages/${page.id}`, { name: name.trim(), slug: slug.trim() })
      .subscribe({ next: () => this.load(), error: (error) => this.fail(error) });
  }

  protected removePage(page: PageRow): void {
    this.confirm(`Delete the page ${page.name}?`, () =>
      this.http.delete(`/api/pages/${page.id}`).subscribe({
        next: () => this.load(undefined, ''),
        error: (error) => this.fail(error),
      }),
    );
  }

  // --- plumbing -----------------------------------------------------------

  private confirm(message: string, run: () => void): void {
    this.dialogs
      .open<boolean>(new PolymorpheusComponent(ConfirmDialogComponent), {
        label: 'Confirm',
        size: 's',
        data: { message, confirmLabel: 'Delete' },
      })
      .subscribe((confirmed) => confirmed && run());
  }

  private load(keepBlockId?: string, keepPageId?: string): void {
    this.http.get<SiteDetail>(`/api/sites/${this.siteId}`).subscribe({
      next: (site) => {
        this.site.set(site);
        this.error.set(null);

        const pageId =
          keepPageId ??
          (site.pages.some((page) => page.id === this.selectedPageId())
            ? this.selectedPageId()
            : (site.pages[0]?.id ?? ''));
        this.selectedPageId.set(pageId);

        const blocks = this.page()?.blocks ?? [];
        const blockId = keepBlockId ?? this.selectedBlockId();
        this.selectBlock(blocks.some((block) => block.id === blockId) ? blockId : '');

        this.previewNonce.update((value) => value + 1);
      },
      error: (error) => this.fail(error),
    });
  }

  private refreshPreviewToken(): void {
    this.http
      .post<PreviewTokenResponse>(`/api/render/sites/${this.siteId}/preview-token`, {})
      .subscribe({
        next: (response) => this.previewToken.set(response.token),
        error: () => this.previewToken.set(''),
      });
  }

  /** Preview links expire, so a refresh mints a new one before reloading. */
  protected refreshPreview(): void {
    this.refreshPreviewToken();
    this.previewNonce.update((value) => value + 1);
  }

  private fail(error: any): void {
    this.saving.set(false);
    const message = error?.error?.message;
    this.error.set(Array.isArray(message) ? message.join(', ') : (message ?? 'Request failed.'));
  }
}
