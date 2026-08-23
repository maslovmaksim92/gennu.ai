import js from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

/**
 * One config for the whole workspace.
 *
 * `pnpm lint` used to exit zero without checking anything: ESLint was a
 * dependency, the script existed, and no configuration or project target did.
 * Running ESLint over the repo directly — rather than through per-project Nx
 * targets — keeps every file covered, including the libraries that have no
 * `project.json` of their own.
 *
 * The type-aware rule sets are deliberately not enabled. They need a program
 * per tsconfig and would turn a fast check into a slow one; the rules below are
 * the ones that catch mistakes rather than restate style, which Prettier
 * already owns.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.angular/**',
      '.nx/**',
      'coverage/**',
      '**/*.d.ts',
    ],
  },

  // TypeScript everywhere.
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      /**
       * `any` is still used where a request body meets Nest's decorators and
       * where Prisma's generated types do not line up. Those spots are worth
       * seeing in a report without failing the build over them.
       */
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Angular components and their templates.
  {
    files: ['apps/admin/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['atlas', 'proto'], style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['atlas', 'proto'], style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['apps/admin/**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },

  // Node scripts and seeds run outside the browser.
  {
    files: ['scripts/**/*.mjs', 'prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
