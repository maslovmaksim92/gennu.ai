import { describe, expect, it } from 'vitest';
import { renderPage, selectPage } from './render-page';
import type { RenderSiteInput } from './types';

const site: RenderSiteInput = {
  name: 'Клиника',
  theme: {
    tokens: {
      color: { ink: '#151820', bg: '#ffffff' },
      space: { lg: '48px' },
    },
  },
  pages: [
    {
      name: 'Главная',
      slug: '/',
      blocks: [
        {
          id: 'b1',
          key: 'hero',
          schema: {
            layout: { tag: 'section', children: [{ tag: 'h1', text: { bind: 'title' } }] },
            css: 'h1{font-size:48px}',
          },
          data: { title: 'Добро пожаловать' },
        },
      ],
    },
    { name: 'Контакты', slug: '/contacts', blocks: [] },
  ],
};

describe('renderPage', () => {
  it('produces a complete document', () => {
    const { html } = renderPage(site, site.pages[0]);

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Главная — Клиника</title>');
    expect(html).toContain('<h1>Добро пожаловать</h1>');
  });

  it('emits theme tokens as css custom properties', () => {
    const { html } = renderPage(site, site.pages[0]);

    expect(html).toContain('--color-ink: #151820;');
    expect(html).toContain('--space-lg: 48px;');
  });

  it('scopes block css to the block', () => {
    const { html } = renderPage(site, site.pages[0]);

    expect(html).toContain('.blk-hero h1{font-size:48px}');
  });

  it('marks previews as noindex only when asked', () => {
    expect(renderPage(site, site.pages[0], { noIndex: true }).html).toContain('name="robots"');
    expect(renderPage(site, site.pages[0]).html).not.toContain('name="robots"');
  });

  it('renders navigation for multi-page sites and marks the current page', () => {
    const { html } = renderPage(site, site.pages[0], { basePath: '/api/render/preview/abc' });

    expect(html).toContain('href="/api/render/preview/abc/contacts"');
    expect(html).toContain('aria-current="page"');
  });

  it('links pages through a query parameter when one is configured', () => {
    const { html } = renderPage(site, site.pages[0], {
      basePath: '/api/render/preview/abc',
      pageParam: 'page',
    });

    expect(html).toContain('href="/api/render/preview/abc?page=%2Fcontacts"');
  });

  it('escapes the site and page names in the title', () => {
    const hostile: RenderSiteInput = {
      name: '</title><script>alert(1)</script>',
      pages: [{ name: 'X', slug: '/', blocks: [] }],
    };

    expect(renderPage(hostile, hostile.pages[0]).html).not.toContain('<script>');
  });

  it('reports issues instead of dropping them silently', () => {
    const broken: RenderSiteInput = {
      name: 'S',
      pages: [
        {
          name: 'P',
          slug: '/',
          blocks: [{ id: 'b', key: 'k', schema: { layout: { tag: 'iframe' } }, data: {} }],
        },
      ],
    };

    const { issues } = renderPage(broken, broken.pages[0]);
    expect(issues).toHaveLength(1);
    expect(issues[0].blockId).toBe('b');
  });
});

describe('selectPage', () => {
  it('finds a page by slug and tolerates a missing leading slash', () => {
    expect(selectPage(site, '/contacts')?.slug).toBe('/contacts');
    expect(selectPage(site, 'contacts')?.slug).toBe('/contacts');
  });

  it('falls back to the first page', () => {
    expect(selectPage(site, undefined)?.slug).toBe('/');
    expect(selectPage(site, '/nope')?.slug).toBe('/');
  });
});
