import { describe, expect, it } from 'vitest';
import { validateBlockSchema } from './validate';

describe('validateBlockSchema', () => {
  it('accepts a well-formed layout', () => {
    expect(
      validateBlockSchema({
        layout: { tag: 'section', children: [{ tag: 'h1', text: { bind: 'title' } }] },
      }),
    ).toEqual([]);
  });

  it('requires a layout', () => {
    expect(validateBlockSchema({})[0].path).toBe('schema.layout');
    expect(validateBlockSchema(undefined)[0].path).toBe('schema');
  });

  it('reports disallowed tags and attributes with their path', () => {
    const issues = validateBlockSchema({
      layout: {
        tag: 'section',
        children: [{ tag: 'iframe', attrs: { onload: 'alert(1)' } as never }],
      },
    });

    expect(issues.map((issue) => issue.path)).toEqual([
      'layout.children[0]',
      'layout.children[0].attrs.onload',
    ]);
  });
});
