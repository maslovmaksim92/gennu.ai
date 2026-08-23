# Regression Checklist

## Known failures already encountered

### TypeScript 6 aliases

Failure:

`Non-relative paths are not allowed when 'baseUrl' is not set.`

Bad follow-up fix: re-add `baseUrl`, which triggers TS5101 in TypeScript 6.

Correct project pattern:

```json
{
  "compilerOptions": {
    "paths": {
      "@atlas/contracts": ["./libs/contracts/src/index.ts"],
      "@atlas/render": ["./libs/engine/render/src/index.ts"]
    }
  }
}
```

### NestJS cannot find AppModule

Failure:

`Error: Cannot find module './app/app.module'`

Known root cause: `@nx/esbuild:esbuild` with `bundle: false` emitted the entrypoint without internal runtime modules. Current project rule: keep `bundle: true` and verify runtime output after target changes.

### Seed cannot see admin credentials

Failure:

`ADMIN_EMAIL and ADMIN_PASSWORD are required`

Known root cause: standalone seed did not load root `.env`.

Project pattern:

```bash
node --env-file=.env --import=tsx prisma/seed.ts
```

### User table does not exist

Failure:

`The table public.User does not exist in the current database.`

Meaning: env loading/database connectivity worked, but schema was not pushed to that database.

Correct sequence:

```bash
pnpm dev:infra
pnpm db:generate
pnpm db:push
pnpm db:seed
```

Prefer `pnpm db:setup` when available.

## Cross-layer checks

- When editing tsconfig, check Angular bundler resolution and NestJS backend overrides separately.
- When editing package scripts, verify `.env`, Prisma schema path, and working-directory assumptions.
- When editing Prisma schema, regenerate client, synchronize database, then seed.
- When editing Nx `project.json`, verify executor schema, output path, dependent target, and runtime expectations.
- When changing build output, inspect executable entrypoint location and referenced static/frontend output paths.
- If a Prisma error starts with `Invalid prisma.<model>.<operation>() invocation`, obtain the complete error body/code before diagnosing.
