import type { BindRef, RenderValue, ValueRef } from './types';

/** Data visible to one node: the block data plus any repeat aliases above it. */
export type Scope = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isBindRef(value: RenderValue | undefined): value is BindRef {
  return isRecord(value) && typeof (value as BindRef).bind === 'string';
}

export function isValueRef(value: RenderValue | undefined): value is ValueRef {
  return isRecord(value) && ('bind' in value || 'const' in value);
}

/**
 * Reads a dot path out of the scope.
 *
 * Numeric segments index into arrays, so `items.0.label` works. Prototype keys
 * are rejected so block JSON cannot reach `constructor` or `__proto__`.
 */
export function readPath(scope: Scope, path: string): unknown {
  if (!path) {
    return undefined;
  }

  let current: unknown = scope;

  for (const segment of path.split('.')) {
    if (
      !segment ||
      segment === '__proto__' ||
      segment === 'constructor' ||
      segment === 'prototype'
    ) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/** Converts a resolved value to the string the renderer will escape. */
export function stringify(value: unknown): string {
  if (value === null || value === undefined || typeof value === 'object') {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : '';
  }

  return String(value);
}

/** Resolves a literal, a `const` reference or a `bind` reference to a string. */
export function resolveValue(value: RenderValue | undefined, scope: Scope): string {
  if (value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if ('const' in value) {
    return typeof value.const === 'string' ? value.const : '';
  }

  const resolved = stringify(readPath(scope, value.bind));
  return resolved !== '' ? resolved : (value.fallback ?? '');
}

/** Truthiness used by `when` and `unless`. Empty arrays and blank strings are falsy. */
export function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0;
  }

  return Boolean(value);
}

/**
 * Shallow-merges block defaults under the instance data.
 *
 * Defaults exist so a block still renders when the generator omits an optional
 * field; instance data always wins.
 */
export function mergeData(
  defaults: Readonly<Record<string, unknown>> | undefined,
  data: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(defaults ?? {}) };

  for (const [key, value] of Object.entries(data ?? {})) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}
