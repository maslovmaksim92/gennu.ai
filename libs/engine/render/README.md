# @atlas/render

The portable theme/block render engine. It turns a stored `Site` into HTML and
has no dependencies — not Angular, not NestJS, not Tailwind and not Taiga UI.

The contract it implements is documented in [`docs/rendering.md`](../../../docs/rendering.md).

## How it is consumed

This is a pnpm workspace package, so `@atlas/render` is a real entry in
`node_modules` rather than only a TypeScript path alias. That matters for
`admin-api`, which is compiled with plain `tsc`: `tsc` does not rewrite path
aliases into the emitted JavaScript, so an alias-only import compiles and then
throws `MODULE_NOT_FOUND` at runtime.

- `admin-api` resolves `@atlas/render` through `node_modules` to `dist/`, built
  by this package's `build` target. `admin-api:build` depends on it.
- The Angular admin and the Vitest specs resolve the same name through the
  `tsconfig.base.json` path alias, straight from `src/` — no build step needed
  while developing.

## Commands

```bash
npx nx build render-engine   # emits dist/ with .js and .d.ts
pnpm test                    # runs the engine's specs from src/
```

`dist/` is generated and git-ignored. Rebuild it after changing the engine, or
just run `pnpm build:admin`, which builds it first.
