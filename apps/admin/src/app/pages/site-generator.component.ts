import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AtlasButtonDirective,
  AtlasControlDirective,
  AtlasFieldComponent,
} from '@atlas/ui';

interface TemplateRow {
  id: string;
  key: string;
  name: string;
  versionId: string | null;
  version: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | null;
}

interface BlockRow {
  id: string;
  key: string;
  name: string;
  versionId: string | null;
  version: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | null;
}

interface ThemeRow {
  id: string;
  key: string;
  name: string;
  versionId: string | null;
  version: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | null;
}

interface GeneratedSiteResponse {
  site: {
    id: string;
    name: string;
    pages: Array<{
      id: string;
      name: string;
      slug: string;
      blocks: Array<{
        id: string;
        blockVersionId: string;
        data: unknown;
        settings: unknown;
      }>;
    }>;
  };
  generation: {
    model: string;
    responseId?: string;
    templateVersionId: string;
  };
}

@Component({
  imports: [FormsModule, AtlasButtonDirective, AtlasControlDirective, AtlasFieldComponent],
  templateUrl: './site-generator.component.html',
  styleUrl: './site-generator.component.scss',
})
export class SiteGeneratorComponent {
  private readonly http = inject(HttpClient);

  protected readonly templates = signal<TemplateRow[]>([]);
  protected readonly blocks = signal<BlockRow[]>([]);
  protected readonly themes = signal<ThemeRow[]>([]);
  protected readonly selectedBlockVersionIds = signal<Set<string>>(new Set());
  protected readonly creatingTemplate = signal(false);
  protected readonly generating = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<GeneratedSiteResponse | null>(null);

  protected templateKey = '';
  protected templateName = '';
  protected templateDescription = '';
  protected defaultThemeVersionId = '';
  protected selectedTemplateVersionId = '';
  protected prompt = '';

  protected readonly availableBlocks = computed(() =>
    this.blocks().filter((block) => block.versionId && block.status !== 'DEPRECATED'),
  );
  protected readonly availableThemes = computed(() =>
    this.themes().filter((theme) => theme.versionId && theme.status !== 'DEPRECATED'),
  );
  protected readonly availableTemplates = computed(() =>
    this.templates().filter((template) => template.versionId && template.status !== 'DEPRECATED'),
  );
  protected readonly resultJson = computed(() =>
    this.result() ? JSON.stringify(this.result(), null, 2) : '',
  );

  public constructor() {
    this.loadCatalog();
  }

  protected toggleTemplateForm(): void {
    this.creatingTemplate.update((value) => !value);
    this.error.set(null);
  }

  protected toggleBlock(versionId: string, checked: boolean): void {
    const next = new Set(this.selectedBlockVersionIds());
    if (checked) {
      next.add(versionId);
    } else {
      next.delete(versionId);
    }
    this.selectedBlockVersionIds.set(next);
  }

  protected createTemplate(): void {
    const allowedBlockVersionIds = [...this.selectedBlockVersionIds()];
    if (!this.templateKey.trim() || !this.templateName.trim() || !allowedBlockVersionIds.length) {
      this.error.set('Template key, name and at least one block version are required.');
      return;
    }

    this.error.set(null);
    this.http
      .post<any>('/api/templates', {
        key: this.templateKey.trim(),
        name: this.templateName.trim(),
        description: this.templateDescription.trim() || undefined,
        schema: {
          allowedBlockVersionIds,
          defaultThemeVersionId: this.defaultThemeVersionId || undefined,
        },
      })
      .subscribe({
        next: (template) => {
          const versionId = template.versions?.[0]?.id as string | undefined;
          this.resetTemplateForm();
          this.creatingTemplate.set(false);
          this.loadCatalog(versionId);
        },
        error: (error) => this.error.set(this.errorMessage(error)),
      });
  }

  protected generate(): void {
    if (!this.selectedTemplateVersionId || !this.prompt.trim()) {
      this.error.set('Select a template and enter a generation request.');
      return;
    }

    this.error.set(null);
    this.result.set(null);
    this.generating.set(true);
    this.http
      .post<GeneratedSiteResponse>('/api/site-generator/generate', {
        templateVersionId: this.selectedTemplateVersionId,
        prompt: this.prompt.trim(),
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.generating.set(false);
        },
        error: (error) => {
          this.error.set(this.errorMessage(error));
          this.generating.set(false);
        },
      });
  }

  private loadCatalog(selectTemplateVersionId?: string): void {
    this.http.get<TemplateRow[]>('/api/templates').subscribe((templates) => {
      this.templates.set(templates);
      if (selectTemplateVersionId) {
        this.selectedTemplateVersionId = selectTemplateVersionId;
      } else if (!this.selectedTemplateVersionId) {
        this.selectedTemplateVersionId = templates.find((item) => item.versionId)?.versionId ?? '';
      }
    });
    this.http.get<BlockRow[]>('/api/blocks').subscribe((blocks) => this.blocks.set(blocks));
    this.http.get<ThemeRow[]>('/api/themes').subscribe((themes) => this.themes.set(themes));
  }

  private resetTemplateForm(): void {
    this.templateKey = '';
    this.templateName = '';
    this.templateDescription = '';
    this.defaultThemeVersionId = '';
    this.selectedBlockVersionIds.set(new Set());
  }

  private errorMessage(error: any): string {
    const message = error?.error?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return typeof message === 'string' ? message : 'Request failed.';
  }
}
