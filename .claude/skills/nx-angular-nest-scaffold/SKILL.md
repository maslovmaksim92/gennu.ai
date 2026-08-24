---
name: nx-angular-nest-scaffold
description: Scaffold a brand-new Nx monorepo with the Angular + NestJS + Prisma/PostgreSQL + Tailwind + Taiga UI stack, JWT bearer auth, and the dev-Postgres-only / prod-single-container Docker split used in the Proto.ai project. Use this whenever the user wants to start a new project, bootstrap a new app, or spin up "a project like gennu.ai / Proto.ai", asks for an Nx + Angular + NestJS starter/template/boilerplate, wants a new admin panel + API monorepo, or says things like "new project with the same stack", "scaffold a new repo", "set up a new Nx workspace", even if they don't name every technology explicitly. Do not use this for adding a feature to an existing app, or for stacks that aren't Angular+NestJS+Nx (e.g. plain Next.js, Django, Rails) — ask first if the requested stack looks different from this one.
---

# Nx + Angular + NestJS scaffold

Reproduces the shape of the Proto.ai repo (`C:\git\gennu.ai`) as a starting point for a new,
unrelated project: pnpm-workspace Nx monorepo, one Angular admin-style app, one NestJS API app,
Prisma/PostgreSQL, Tailwind + Taiga UI, JWT bearer auth stored in `sessionStorage`, and a
dev-vs-prod Docker split where dev only containerizes Postgres and prod bundles both apps into one
container.

This skill produces a **generic starting template** — it deliberately leaves out anything specific
to Proto.ai's product (the AI site generator, OpenAI integration, Theme/Block/Template domain
models). The one domain pattern worth reusing elsewhere — immutable version lifecycle — is offered
as an opt-in add-on, not baked into the base scaffold. See
[references/versioning-pattern.md](references/versioning-pattern.md).

## Before generating anything, ask

Don't guess these — a wrong default costs a rename/rewrite later. Ask in one go:

1. **Project name** (npm package name / root folder name).
2. **Target directory** (where to create it).
3. **App names** — default `admin` (Angular) + `admin-api` (NestJS). Fine to keep as-is; only
   rename if the user's domain isn't admin-panel-shaped (e.g. `web` + `api`).
4. **Tailwind + Taiga UI, yes/no** — default yes, since that's most of the value of this template.
   If no, skip step 4 below and let the user pick their own UI kit.
5. **Optional add-ons** — mention the versioning-lifecycle pattern
   ([references/versioning-pattern.md](references/versioning-pattern.md)) exists if their domain
   has entities that get published/versioned (themes, templates, workflows, form schemas, ...).
   Default: skip unless they ask.

Everything below assumes pnpm is available and Corepack is enabled (`corepack enable`). If Nx,
Docker, or pnpm aren't installed, say so before starting rather than failing mid-scaffold.

## Steps

### 1. Workspace root

Create the target directory, then `pnpm init` inside it and drop in the generic, project-name-
independent config files verbatim from `assets/`:

- `assets/nx.json` → `nx.json`
- `assets/tsconfig.base.json` → `tsconfig.base.json` (adjust the `paths` map once you know if
  there'll be a `libs/` package — drop the `@atlas/*`-style entries if there's no shared lib yet)
- `assets/pnpm-workspace.yaml` → `pnpm-workspace.yaml`
- `assets/.prettierrc.json` → `.prettierrc.json`
- `assets/.prettierignore` → `.prettierignore`
- `assets/.postcssrc.json` → `.postcssrc.json` (only if step 4 is happening — Tailwind's PostCSS
  plugin)
- `assets/scripts/check-inline-templates.mjs` → `scripts/check-inline-templates.mjs`

Then merge `assets/package.json.template` into the freshly-`pnpm init`'d `package.json`: keep the
`scripts` block as-is (it encodes the whole dev/build/db/check workflow — see
[references/conventions.md](references/conventions.md) for what each script is for and why), set
`"name"` to the project name, set `"packageManager": "pnpm@10.17.1"` (or whatever pnpm the user has
via `pnpm -v`), and add the `devDependencies` listed. Run `pnpm install` once the root is in place
so Nx generators below have a workspace to operate in.

### 2. Generate the two Nx apps

Don't hand-write Angular/NestJS boilerplate — use the official Nx generators, then layer the
project's conventions on top:

```bash
pnpm add -D nx @nx/angular @nx/nest @nx/node @nx/js @nx/eslint @nx/jest @nx/esbuild @nx/workspace
pnpm exec nx g @nx/angular:app admin --style=scss --routing --standalone --e2eTestRunner=none
pnpm exec nx g @nx/nest:app admin-api --e2eTestRunner=none
```

(swap `admin`/`admin-api` for the app names chosen above). Confirm with `pnpm exec nx show projects`
before moving on.

Set the NestJS app's `main.ts` to serve the Angular build in production and fall back to the SPA's
`index.html` for non-`/api` routes — this single trick is what lets prod run both apps from one
container/port. Copy the pattern from `assets/main.ts.template`, adjust the static-root path to
match the Angular app's actual output dir, and add `app.setGlobalPrefix('api')` plus
`app.enableCors({ origin: process.env.ADMIN_WEB_URL ?? 'http://localhost:4200' })` so local dev
(Angular on :4200, API on :3001) still works.

### 3. Prisma + PostgreSQL

```bash
pnpm add @prisma/client
pnpm add -D prisma tsx
```

Create `prisma/schema.prisma` — start from `assets/prisma/schema.prisma` (just a `User` model with
password hash + role, enough to build real auth on top of) rather than inventing fields ahead of
need. Wire the `db:*` scripts already in `package.json.template` — they all pass
`--schema=prisma/schema.prisma` explicitly, which matters once there's more than one schema file
in a monorepo. Point `DATABASE_URL` at the dev Postgres container from step 5.

### 4. Tailwind + Taiga UI (skip if the user said no)

Load the **`taiga-ui`** skill from `.claude/skills/taiga-ui/SKILL.md` if it's vendored into this
new repo already, or fetch it into the new repo with `npx skills add taiga-ui` (mirroring how
Proto.ai vendors it — see [references/conventions.md](references/conventions.md)) before wiring
providers, theming, or components. Don't hand-roll Taiga UI setup from general knowledge — that
skill is kept current against the installed major version and this one isn't. Install Tailwind 4
(`pnpm add -D tailwindcss @tailwindcss/postcss`) and drop `assets/.postcssrc.json` in if you
haven't already.

### 5. Auth: JWT bearer, no cookies

Read [references/auth-pattern.md](references/auth-pattern.md) before implementing this — it covers
why the token lives in Angular `sessionStorage` instead of a cookie, and the shape of the NestJS
guard/strategy. Install `@nestjs/jwt` and `bcryptjs`.

### 6. Docker: dev = Postgres only, prod = one bundled container

Read [references/docker-model.md](references/docker-model.md) first — it explains *why* the split
exists, not just what to copy. Then:

- `assets/compose/compose.dev.yml` → `compose/compose.dev.yml` (Postgres only, used for local dev)
- `assets/compose/compose.admin.yml` → `compose/compose.admin.yml` (the bundled app + Postgres,
  used for the production image)
- `assets/docker/admin.Dockerfile` → `docker/admin.Dockerfile` (multi-stage: build both apps,
  runtime stage only ships `dist/`, `node_modules`, and `prisma/`)

Substitute the app names from step 2 into all three files, and update the `CMD` in the Dockerfile
to point at the NestJS app's actual `main.js` output path.

### 7. Repo conventions scaffolding

Copy `assets/AGENTS.md.template` → `AGENTS.md` at the repo root and fill in the project name. This
is what tells future agents (including you, next time) where the conventions live — see
[references/conventions.md](references/conventions.md) for the full rationale on why this repo
externalizes conventions into `.agents/skills/` + `.claude/skills/` instead of one long instructions
file. Create empty `.agents/skills/` — the new project earns its own convention docs over time,
don't pre-write Proto.ai's into it.

### 8. Verify

```bash
pnpm dev:infra          # start Postgres in Docker
pnpm db:generate
pnpm db:push
pnpm dev:admin           # Angular on :4200, NestJS API on :3001
```

Confirm the Angular app loads and hits the API. Then sanity-check the prod path once, since it's
easy to get the static-serving path wrong: `docker compose -f compose/compose.admin.yml up --build`
and load the app on the port the Dockerfile exposes. Don't report the scaffold as done until both
the dev and prod paths actually started — this mirrors the project's own rule of never claiming
build/runtime success without having run it.

## Reference files

- [references/conventions.md](references/conventions.md) — what each root script does, why
  conventions live in `.agents/skills/`+`.claude/skills/`, the inline-template-length rule, and the
  "Taiga UI tables for all data tables" rule.
- [references/docker-model.md](references/docker-model.md) — the dev/prod Docker split and the
  single-container static-serving trick, in depth.
- [references/auth-pattern.md](references/auth-pattern.md) — JWT bearer + `sessionStorage`, no
  cookies, and why.
- [references/versioning-pattern.md](references/versioning-pattern.md) — optional immutable
  version-lifecycle pattern (`DRAFT -> PUBLISHED -> DEPRECATED`), only pull this in if the new
  project's domain actually has publishable/versioned entities.
