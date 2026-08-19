---
name: proto-nx-debugging
description: Diagnose and fix runtime, build, Nx, Angular, NestJS, TypeScript 6, Prisma, PostgreSQL, Docker, and local-development errors in the Proto.ai monorepo. Use whenever pnpm dev:admin, nx build/serve, db:generate, db:push, db:seed, Prisma Studio, Admin startup, module resolution, or TypeScript path/config errors fail.
---

# Proto.ai Nx Debugging

Use [references/regression-checklist.md](references/regression-checklist.md) as the authoritative regression checklist.

## Workflow

1. Read the complete error, including lines after wrapper messages such as `Invalid prisma... invocation`.
2. Inspect the exact repository files controlling the failing layer before changing anything.
3. Identify the failing layer: package script, Nx target, TS config, Angular compiler, NestJS build/runtime, Prisma client/schema, PostgreSQL, env loading, Docker, or application code.
4. Fix the root cause, not just the first visible symptom.
5. Check adjacent layers that the fix can affect.
6. Prefer reusable project commands over one-off shell workarounds.
7. Never claim success unless the relevant command actually ran successfully.

## Mandatory regression rules

- TypeScript 6 path aliases: do not reintroduce deprecated `baseUrl`; use explicit relative `paths` values such as `./libs/...`.
- Do not silence TS6 deprecations when a non-deprecated config exists.
- NestJS Admin API esbuild output must include internal modules. With the current project use `bundle: true`; do not return to `bundle: false` if runtime starts from bundled `main.js`.
- Prisma development order: `db:generate -> db:push -> db:seed`.
- Seed is not a schema-creation step.
- Standalone seed must load `.env` explicitly via Node `--env-file=.env` and `--import=tsx`.
- Keep `DATABASE_URL` consistent across Prisma CLI, seed, NestJS, and Docker.
- After Nx executor/build changes verify both output shape and runtime module resolution.

## Validation

Use the narrowest applicable checks: `pnpm nx:check`, `nx build admin`, `nx build admin-api`, `pnpm build:admin`, `pnpm dev:admin`, `pnpm db:generate`, `pnpm db:push`, `pnpm db:seed`, `pnpm db:setup`, `pnpm db:studio`, and TypeScript formatting checks.
