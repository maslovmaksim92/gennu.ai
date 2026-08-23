/**
 * Portable rendering contract for the Theme/Block engine.
 *
 * This module must stay free of Tailwind, Taiga UI, Angular and NestJS
 * imports. It describes what a theme and a block look like, not how any
 * particular framework draws them.
 */

/** A group of design tokens, for example `color` or `space`. */
export type TokenGroup = Readonly<Record<string, string>>;

/**
 * Stored in `ThemeVersion.schema`.
 *
 * Every token becomes a CSS custom property named `--<group>-<name>`, so
 * `tokens.color.ink` is available to blocks as `var(--color-ink)`.
 */
export interface ThemeSchema {
  readonly tokens?: Readonly<Record<string, TokenGroup>>;
  /** Optional global CSS appended after the token declarations. */
  readonly css?: string;
}

/** A reference to block data resolved at render time. */
export interface BindRef {
  /** Dot path inside the block data, for example `title` or `items.0.label`. */
  readonly bind: string;
  /** Used when the path resolves to `undefined`, `null` or an empty string. */
  readonly fallback?: string;
}

/** A literal value that still goes through escaping and URL sanitising. */
export interface ConstRef {
  readonly const: string;
}

export type ValueRef = BindRef | ConstRef;

/** Anything that can end up as text or an attribute value. */
export type RenderValue = string | ValueRef;

/**
 * One element of a block layout.
 *
 * The engine never evaluates code from this tree: tags and attributes are
 * checked against allowlists, URLs are sanitised and all text is escaped.
 */
export interface RenderNode {
  /** Element tag. Must be present in the tag allowlist. */
  readonly tag: string;
  readonly class?: string | readonly string[];
  /** Inline styles. Values may reference tokens with `{group.name}`. */
  readonly style?: Readonly<Record<string, RenderValue>>;
  readonly attrs?: Readonly<Record<string, RenderValue>>;
  /** Text content, rendered before `children`. */
  readonly text?: RenderValue;
  readonly children?: readonly RenderNode[];
  /** Repeats this node once per array item. */
  readonly repeat?: BindRef;
  /** Name the repeated item is bound to. Defaults to `item`. */
  readonly as?: string;
  /** Renders the node only when the referenced value is truthy. */
  readonly when?: BindRef;
  /** Renders the node only when the referenced value is falsy. */
  readonly unless?: BindRef;
}

/** One editable input of a block, used by the admin editors and by the AI catalog. */
export interface BlockField {
  readonly key: string;
  readonly type: 'text' | 'richtext' | 'url' | 'image' | 'number' | 'boolean' | 'list';
  readonly label?: string;
  readonly required?: boolean;
  /** For `list` fields: the shape of a single item. */
  readonly fields?: readonly BlockField[];
}

/** Stored in `BlockVersion.schema`. */
export interface BlockSchema {
  readonly fields?: readonly BlockField[];
  readonly layout?: RenderNode;
  /** Block-scoped CSS. The engine prefixes every selector with the block scope. */
  readonly css?: string;
}

/** One block placed on a page, resolved from `BlockInstance`. */
export interface RenderBlockInput {
  readonly id: string;
  /** `BlockDefinition.key`, used to build the CSS scope class. */
  readonly key: string;
  readonly schema: BlockSchema;
  readonly defaults?: Readonly<Record<string, unknown>>;
  readonly data: Readonly<Record<string, unknown>>;
  readonly settings?: Readonly<Record<string, unknown>>;
}

export interface RenderPageInput {
  readonly name: string;
  readonly slug: string;
  readonly blocks: readonly RenderBlockInput[];
}

export interface RenderSiteInput {
  readonly name: string;
  readonly theme?: ThemeSchema;
  readonly pages: readonly RenderPageInput[];
}

export interface RenderOptions {
  /** Base path prepended to internal links, for example a preview mount point. */
  readonly basePath?: string;
  /**
   * When set, page links become `?<pageParam>=<slug>` instead of path segments.
   * The preview endpoint uses this so it needs no wildcard route.
   */
  readonly pageParam?: string;
  /** Adds `<meta name="robots" content="noindex">`. Enabled for previews. */
  readonly noIndex?: boolean;
  /** Language attribute of the document. Defaults to `ru`. */
  readonly lang?: string;
}

/** A problem the engine refused to render, reported instead of being thrown away. */
export interface RenderIssue {
  readonly blockId?: string;
  readonly path: string;
  readonly message: string;
}

export interface RenderResult {
  readonly html: string;
  readonly issues: readonly RenderIssue[];
}
