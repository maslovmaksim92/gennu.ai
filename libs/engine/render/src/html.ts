/**
 * HTML primitives: escaping, allowlists and URL sanitising.
 *
 * Everything a block author writes is untrusted input by the time it reaches
 * the renderer, because a block layout is stored as JSON in the database and
 * generated site data comes from a language model. Nothing here interpolates
 * raw markup.
 */

const ESCAPE_MAP: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Elements that may appear in a block layout. */
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'section',
  'article',
  'div',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'strong',
  'em',
  'small',
  'blockquote',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'figure',
  'figcaption',
  'img',
  'picture',
  'source',
  'a',
  'button',
  'hr',
  'br',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'time',
  'address',
]);

/** Elements that never receive a closing tag. */
export const VOID_TAGS: ReadonlySet<string> = new Set(['img', 'br', 'hr', 'source']);

/** Attributes allowed on any element. */
export const ALLOWED_ATTRS: ReadonlySet<string> = new Set([
  'id',
  'title',
  'alt',
  'href',
  'src',
  'srcset',
  'sizes',
  'target',
  'rel',
  'width',
  'height',
  'loading',
  'decoding',
  'type',
  'role',
  'datetime',
  'colspan',
  'rowspan',
]);

/** Attributes carrying a URL, which must pass {@link sanitizeUrl}. */
export const URL_ATTRS: ReadonlySet<string> = new Set(['href', 'src', 'srcset']);

const SAFE_URL_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** Escapes text so it can never close the surrounding element. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPE_MAP[character] ?? character);
}

/** True for attribute names the engine is willing to emit. */
export function isAllowedAttribute(name: string): boolean {
  const lower = name.toLowerCase();

  if (lower.startsWith('on')) {
    return false;
  }

  if (lower.startsWith('data-') || lower.startsWith('aria-')) {
    return /^[a-z-]+$/.test(lower);
  }

  return ALLOWED_ATTRS.has(lower);
}

/**
 * Returns a safe URL or `null`.
 *
 * Relative URLs, fragments and absolute paths are kept as-is. Absolute URLs are
 * only kept for an explicit scheme allowlist, which rules out `javascript:`,
 * `data:` and `vbscript:`.
 */
export function sanitizeUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // Control characters and stray whitespace are used to smuggle `java\nscript:`
  // past naive scheme checks, so they are stripped before the scheme is read.
  // eslint-disable-next-line no-control-regex
  const normalized = trimmed.replace(/[\u0000-\u0020\u007f-\u00a0]/g, '');

  if (normalized.startsWith('/') || normalized.startsWith('#') || normalized.startsWith('?')) {
    return normalized;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) {
    const scheme = normalized.slice(0, normalized.indexOf(':') + 1).toLowerCase();
    return SAFE_URL_SCHEMES.has(scheme) ? normalized : null;
  }

  // Protocol-relative URLs inherit the page scheme, which is acceptable.
  if (normalized.startsWith('//')) {
    return normalized;
  }

  // A bare relative path such as `about` or `img/logo.png`.
  return /^[\w.~-]/.test(normalized) ? normalized : null;
}

/**
 * Returns a safe CSS declaration value or `null`.
 *
 * Blocks legacy IE expressions and any URL that is not itself safe.
 */
export function sanitizeStyleValue(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed || /[;{}<>]/.test(trimmed)) {
    return null;
  }

  if (/expression\s*\(/i.test(trimmed)) {
    return null;
  }

  const urlMatch = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(trimmed);
  if (urlMatch && !sanitizeUrl(urlMatch[1])) {
    return null;
  }

  return trimmed;
}

/**
 * Returns author CSS with the constructs that would break out of `<style>`
 * removed, or `null` when the whole block must be dropped.
 */
export function sanitizeCss(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    /<\/\s*style/i.test(trimmed) ||
    /@import/i.test(trimmed) ||
    /expression\s*\(/i.test(trimmed)
  ) {
    return null;
  }

  if (/javascript\s*:/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Serialises one attribute, assuming the name and value are already checked. */
export function attribute(name: string, value: string): string {
  return `${name}="${escapeHtml(value)}"`;
}
