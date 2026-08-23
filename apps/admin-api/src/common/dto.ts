import type { Prisma } from '@prisma/client';
import { registerDecorator, type ValidationOptions } from 'class-validator';

/**
 * Hands a validated JSON object to Prisma.
 *
 * `Record<string, unknown>` is the honest type for a request body, and
 * `Prisma.InputJsonValue` is what the client wants; they do not overlap
 * structurally even though every value that reaches here has already been
 * checked by `@IsJsonObject`. This is the one place that bridge is asserted,
 * instead of a cast scattered through every controller.
 */
export function toJson(value: Record<string, unknown>): Prisma.InputJsonValue;
export function toJson(value: undefined): undefined;
export function toJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined;
export function toJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

/**
 * Accepts only a plain JSON object.
 *
 * Several columns in the schema are `Json` and every one of them is meant to
 * hold an object — a theme's tokens, a block's fields, a block instance's data.
 * `@IsObject()` alone would let an array through, and Prisma would store it, so
 * arrays and `null` are rejected here rather than downstream.
 */
export function IsJsonObject(options?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'isJsonObject',
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          return typeof value === 'object' && value !== null && !Array.isArray(value);
        },
        defaultMessage() {
          return `${propertyName} must be a JSON object.`;
        },
      },
    });
  };
}

/** A semantic version the versioning helpers can parse. */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/** Keys identify a resource in URLs and prompts, so keep them predictable. */
export const KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
