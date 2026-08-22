import { ALLOWED_TAGS, isAllowedAttribute } from './html';
import type { BlockSchema, RenderIssue, RenderNode } from './types';

const MAX_DEPTH = 24;

/**
 * Checks a block layout before it is stored or published.
 *
 * The renderer already refuses unsafe markup, but reporting the problem while a
 * version is still a draft is far more useful than silently dropping nodes on a
 * published site.
 */
export function validateBlockSchema(schema: BlockSchema | undefined): RenderIssue[] {
  const issues: RenderIssue[] = [];

  if (!schema || typeof schema !== 'object') {
    return [{ path: 'schema', message: 'Block schema must be an object.' }];
  }

  if (!schema.layout) {
    return [{ path: 'schema.layout', message: 'Block schema must define a layout.' }];
  }

  walk(schema.layout, 'layout', 0, issues);
  return issues;
}

function walk(node: RenderNode, path: string, depth: number, issues: RenderIssue[]): void {
  if (depth > MAX_DEPTH) {
    issues.push({ path, message: 'Layout is nested too deeply.' });
    return;
  }

  if (!node || typeof node !== 'object' || typeof node.tag !== 'string') {
    issues.push({ path, message: 'Layout node must have a tag.' });
    return;
  }

  if (!ALLOWED_TAGS.has(node.tag.toLowerCase())) {
    issues.push({ path, message: `Tag "${node.tag}" is not allowed.` });
  }

  for (const name of Object.keys(node.attrs ?? {})) {
    if (!isAllowedAttribute(name)) {
      issues.push({ path: `${path}.attrs.${name}`, message: 'Attribute is not allowed.' });
    }
  }

  if (node.repeat && typeof node.repeat.bind !== 'string') {
    issues.push({ path: `${path}.repeat`, message: 'Repeat must reference a data path.' });
  }

  (node.children ?? []).forEach((child, index) =>
    walk(child, `${path}.children[${index}]`, depth + 1, issues),
  );
}
