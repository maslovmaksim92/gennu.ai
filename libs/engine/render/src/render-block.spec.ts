import { describe, expect, it } from 'vitest';
import { blockScopeClass, renderBlock, scopeBlockCss } from './render-block';
import type { RenderBlockInput, RenderNode } from './types';

function block(
  layout: RenderNode,
  data: Record<string, unknown> = {},
  extra: Partial<RenderBlockInput> = {},
) {
  return renderBlock({
    id: 'block-1',
    key: 'hero',
    schema: { layout },
    data,
    ...extra,
  });
}

describe('renderBlock', () => {
  it('renders text and nested children', () => {
    const result = block(
      {
        tag: 'section',
        children: [
          { tag: 'h1', text: { bind: 'title' } },
          { tag: 'p', text: { bind: 'subtitle' } },
        ],
      },
      { title: 'Клиника', subtitle: 'Стоматология в центре' },
    );

    expect(result.html).toBe(
      '<section class="blk-hero"><h1>Клиника</h1><p>Стоматология в центре</p></section>',
    );
    expect(result.issues).toHaveLength(0);
  });

  it('escapes generated data instead of trusting it', () => {
    const result = block(
      { tag: 'h1', text: { bind: 'title' } },
      {
        title: '<img src=x onerror=alert(1)>',
      },
    );

    expect(result.html).not.toContain('<img');
    expect(result.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('drops javascript urls but keeps the element', () => {
    const result = block(
      { tag: 'a', text: 'Go', attrs: { href: { bind: 'href' } } },
      { href: 'javascript:alert(1)' },
    );

    expect(result.html).toBe('<a class="blk-hero">Go</a>');
    expect(result.issues[0].message).toBe('Unsafe URL was dropped.');
  });

  it('refuses tags outside the allowlist', () => {
    const result = block({ tag: 'script', text: 'alert(1)' });

    expect(result.html).toBe('');
    expect(result.issues[0].message).toContain('not allowed');
  });

  it('refuses event handler attributes', () => {
    const result = block({ tag: 'div', attrs: { onclick: 'alert(1)' } as never });

    expect(result.html).toBe('<div class="blk-hero"></div>');
    expect(result.issues[0].message).toBe('Attribute is not allowed.');
  });

  it('resolves theme tokens inside inline styles', () => {
    const result = block({ tag: 'div', style: { color: '{color.ink}', padding: '{space.lg}' } });

    expect(result.html).toContain('style="color:var(--color-ink);padding:var(--space-lg)"');
  });

  it('falls back to defaults and then to the declared fallback', () => {
    const result = renderBlock({
      id: 'block-1',
      key: 'hero',
      schema: {
        layout: {
          tag: 'section',
          children: [
            { tag: 'h1', text: { bind: 'title' } },
            { tag: 'p', text: { bind: 'note', fallback: 'Без описания' } },
          ],
        },
      },
      defaults: { title: 'Заголовок по умолчанию' },
      data: {},
    });

    expect(result.html).toContain('<h1>Заголовок по умолчанию</h1>');
    expect(result.html).toContain('<p>Без описания</p>');
  });

  it('repeats a node once per array item', () => {
    const result = block(
      {
        tag: 'ul',
        children: [{ tag: 'li', repeat: { bind: 'items' }, text: { bind: 'item.label' } }],
      },
      { items: [{ label: 'Первый' }, { label: 'Второй' }] },
    );

    expect(result.html).toBe('<ul class="blk-hero"><li>Первый</li><li>Второй</li></ul>');
  });

  it('renders nothing for a repeat over a missing list', () => {
    const result = block({ tag: 'ul', children: [{ tag: 'li', repeat: { bind: 'missing' } }] });

    expect(result.html).toBe('<ul class="blk-hero"></ul>');
  });

  it('honours when and unless', () => {
    const layout: RenderNode = {
      tag: 'section',
      children: [
        { tag: 'p', when: { bind: 'showA' }, text: 'A' },
        { tag: 'p', unless: { bind: 'showA' }, text: 'B' },
      ],
    };

    expect(block(layout, { showA: true }).html).toContain('>A<');
    expect(block(layout, { showA: true }).html).not.toContain('>B<');
    expect(block(layout, { showA: false }).html).toContain('>B<');
  });

  it('treats empty strings and empty arrays as falsy', () => {
    const layout: RenderNode = { tag: 'p', when: { bind: 'value' }, text: 'shown' };

    expect(block(layout, { value: '   ' }).html).toBe('');
    expect(block(layout, { value: [] }).html).toBe('');
    expect(block(layout, { value: ['x'] }).html).toBe('<p class="blk-hero">shown</p>');
  });

  it('does not follow prototype paths', () => {
    const result = block({ tag: 'p', text: { bind: 'constructor.name' } }, {});

    expect(result.html).toBe('<p class="blk-hero"></p>');
  });

  it('closes void elements without an end tag', () => {
    const result = block({ tag: 'img', attrs: { src: '/logo.png', alt: 'Логотип' } });

    expect(result.html).toBe('<img class="blk-hero" src="/logo.png" alt="Логотип">');
  });

  it('reports a block version that has no layout', () => {
    const result = renderBlock({ id: 'b', key: 'hero', schema: {}, data: {} });

    expect(result.html).toBe('');
    expect(result.issues[0].message).toContain('no layout');
  });
});

describe('blockScopeClass', () => {
  it('builds a safe class from any key', () => {
    expect(blockScopeClass('hero')).toBe('blk-hero');
    expect(blockScopeClass('Pricing Table!')).toBe('blk-pricing-table');
    expect(blockScopeClass('***')).toBe('blk-block');
  });
});

describe('scopeBlockCss', () => {
  it('prefixes selectors with the block scope', () => {
    expect(scopeBlockCss('h1{color:red}', 'blk-hero')).toBe('.blk-hero h1{color:red}');
  });

  it('supports the & shorthand for the block root', () => {
    expect(scopeBlockCss('&{padding:32px}', 'blk-hero')).toBe('.blk-hero{padding:32px}');
  });

  it('rejects css that escapes the style element', () => {
    expect(scopeBlockCss('</style><script>alert(1)</script>', 'blk-hero')).toBeNull();
  });
});
