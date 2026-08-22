import type { ThemeSchema } from './types';

const TOKEN_REFERENCE = /\{([a-z][\w-]*)\.([a-z][\w-]*)\}/gi;
const SAFE_TOKEN_NAME = /^[a-z][\w-]*$/i;

/** Turns a token group and name into its CSS custom property name. */
export function tokenVariable(group: string, name: string): string {
  return `--${group}-${name}`;
}

/**
 * Replaces `{group.name}` references with `var(--group-name)`.
 *
 * Unknown references are left untouched so that a missing token shows up as a
 * visible literal instead of silently collapsing the declaration.
 */
export function resolveTokenReferences(value: string): string {
  return value.replace(TOKEN_REFERENCE, (match, group: string, name: string) =>
    SAFE_TOKEN_NAME.test(group) && SAFE_TOKEN_NAME.test(name)
      ? `var(${tokenVariable(group, name)})`
      : match,
  );
}

/**
 * Renders theme tokens as a `:root` rule.
 *
 * Token names are filtered rather than escaped: a token is an identifier, and
 * anything that is not a plain identifier is a mistake worth dropping.
 */
export function renderThemeTokens(theme: ThemeSchema | undefined): string {
  const declarations: string[] = [];

  for (const [group, values] of Object.entries(theme?.tokens ?? {})) {
    if (!SAFE_TOKEN_NAME.test(group) || !values) {
      continue;
    }

    for (const [name, value] of Object.entries(values)) {
      if (!SAFE_TOKEN_NAME.test(name) || typeof value !== 'string') {
        continue;
      }

      const safe = value.trim();
      if (!safe || /[;{}<>]/.test(safe)) {
        continue;
      }

      declarations.push(`  ${tokenVariable(group, name)}: ${safe};`);
    }
  }

  return declarations.length ? `:root {\n${declarations.join('\n')}\n}` : '';
}
