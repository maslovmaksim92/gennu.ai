import {
  ALLOWED_TAGS,
  URL_ATTRS,
  VOID_TAGS,
  attribute,
  escapeHtml,
  isAllowedAttribute,
  sanitizeCss,
  sanitizeStyleValue,
  sanitizeUrl,
} from './html';
import { isTruthy, mergeData, readPath, resolveValue, type Scope } from './binding';
import { resolveTokenReferences } from './tokens';
import type { RenderBlockInput, RenderIssue, RenderNode } from './types';

const MAX_DEPTH = 24;
const MAX_REPEAT = 200;
const SAFE_CLASS = /^[a-z][\w-]*$/i;
const SAFE_CSS_PROPERTY = /^-{0,2}[a-z][a-z0-9-]*$/i;

interface NodeContext {
  readonly issues: RenderIssue[];
  readonly blockId: string;
  readonly scopeClass: string;
}

/** Builds the class that scopes a block's own CSS to its own markup. */
export function blockScopeClass(key: string): string {
  const safe = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `blk-${safe || 'block'}`;
}

function classAttribute(node: RenderNode, extra?: string): string | null {
  const raw = Array.isArray(node.class) ? node.class : node.class ? [node.class] : [];
  const names = [...(extra ? [extra] : []), ...raw.filter((name) => SAFE_CLASS.test(name))];

  return names.length ? attribute('class', names.join(' ')) : null;
}

function styleAttribute(
  node: RenderNode,
  scope: Scope,
  context: NodeContext,
  path: string,
): string | null {
  const declarations: string[] = [];

  for (const [property, value] of Object.entries(node.style ?? {})) {
    if (!SAFE_CSS_PROPERTY.test(property)) {
      context.issues.push({
        blockId: context.blockId,
        path: `${path}.style.${property}`,
        message: 'Unsupported CSS property name.',
      });
      continue;
    }

    const resolved = resolveTokenReferences(resolveValue(value, scope));
    const safe = sanitizeStyleValue(resolved);

    if (safe === null) {
      context.issues.push({
        blockId: context.blockId,
        path: `${path}.style.${property}`,
        message: 'Unsafe CSS value was dropped.',
      });
      continue;
    }

    declarations.push(`${property}:${safe}`);
  }

  return declarations.length ? attribute('style', declarations.join(';')) : null;
}

function otherAttributes(
  node: RenderNode,
  scope: Scope,
  context: NodeContext,
  path: string,
): string[] {
  const parts: string[] = [];

  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    if (!isAllowedAttribute(name)) {
      context.issues.push({
        blockId: context.blockId,
        path: `${path}.attrs.${name}`,
        message: 'Attribute is not allowed.',
      });
      continue;
    }

    const resolved = resolveValue(value, scope);
    if (!resolved) {
      continue;
    }

    if (URL_ATTRS.has(name.toLowerCase())) {
      const safe = sanitizeUrl(resolved);
      if (safe === null) {
        context.issues.push({
          blockId: context.blockId,
          path: `${path}.attrs.${name}`,
          message: 'Unsafe URL was dropped.',
        });
        continue;
      }
      parts.push(attribute(name.toLowerCase(), safe));
      continue;
    }

    parts.push(attribute(name.toLowerCase(), resolved));
  }

  return parts;
}

function renderNode(
  node: RenderNode,
  scope: Scope,
  context: NodeContext,
  path: string,
  depth: number,
  rootClass?: string,
): string {
  if (depth > MAX_DEPTH) {
    context.issues.push({
      blockId: context.blockId,
      path,
      message: 'Layout is nested deeper than the engine renders.',
    });
    return '';
  }

  if (!node || typeof node.tag !== 'string' || !ALLOWED_TAGS.has(node.tag.toLowerCase())) {
    context.issues.push({
      blockId: context.blockId,
      path,
      message: `Tag "${String(node?.tag)}" is not allowed.`,
    });
    return '';
  }

  if (node.repeat) {
    const items = readPath(scope, node.repeat.bind);

    if (!Array.isArray(items)) {
      return '';
    }

    const alias = node.as && /^[a-z][\w]*$/i.test(node.as) ? node.as : 'item';
    const { repeat: _repeat, ...template } = node;

    return items
      .slice(0, MAX_REPEAT)
      .map((item, index) =>
        renderNode(
          template as RenderNode,
          { ...scope, [alias]: item, index },
          context,
          `${path}[${index}]`,
          depth,
          rootClass,
        ),
      )
      .join('');
  }

  if (node.when && !isTruthy(readPath(scope, node.when.bind))) {
    return '';
  }

  if (node.unless && isTruthy(readPath(scope, node.unless.bind))) {
    return '';
  }

  const tag = node.tag.toLowerCase();
  const attributes = [
    classAttribute(node, rootClass),
    styleAttribute(node, scope, context, path),
    ...otherAttributes(node, scope, context, path),
  ].filter((part): part is string => part !== null);

  const open = attributes.length ? `<${tag} ${attributes.join(' ')}>` : `<${tag}>`;

  if (VOID_TAGS.has(tag)) {
    return open;
  }

  const text = node.text === undefined ? '' : escapeHtml(resolveValue(node.text, scope));
  const children = (node.children ?? [])
    .map((child, index) =>
      renderNode(child, scope, context, `${path}.children[${index}]`, depth + 1),
    )
    .join('');

  return `${open}${text}${children}</${tag}>`;
}

/** Prefixes every selector of a block's CSS with the block scope class. */
export function scopeBlockCss(css: string, scopeClass: string): string | null {
  const safe = sanitizeCss(css);

  if (safe === null) {
    return null;
  }

  return safe.replace(/(^|\})\s*([^{}@]+)\{/g, (match, brace: string, selectors: string) => {
    const scoped = selectors
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) =>
        selector.startsWith('&')
          ? selector.replace('&', `.${scopeClass}`)
          : `.${scopeClass} ${selector}`,
      )
      .join(', ');

    return `${brace}${scoped ? `${scoped}{` : match}`;
  });
}

export interface RenderedBlock {
  readonly html: string;
  readonly css: string | null;
  readonly issues: readonly RenderIssue[];
}

/** Renders one block instance into markup plus its scoped CSS. */
export function renderBlock(block: RenderBlockInput): RenderedBlock {
  const issues: RenderIssue[] = [];
  const scopeClass = blockScopeClass(block.key);
  const layout = block.schema?.layout;

  if (!layout) {
    issues.push({
      blockId: block.id,
      path: 'schema.layout',
      message: 'Block version has no layout and cannot be rendered.',
    });
    return { html: '', css: null, issues };
  }

  const scope = mergeData(block.defaults, block.data ?? {});
  const context: NodeContext = { issues, blockId: block.id, scopeClass };
  const html = renderNode(layout, scope, context, 'layout', 0, scopeClass);
  const css = block.schema.css ? scopeBlockCss(block.schema.css, scopeClass) : null;

  if (block.schema.css && css === null) {
    issues.push({
      blockId: block.id,
      path: 'schema.css',
      message: 'Block CSS was rejected as unsafe.',
    });
  }

  return { html, css, issues };
}
