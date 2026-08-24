# Repo conventions this template carries over

## Root package.json scripts, and why each exists

- `dev:install` — `pnpm install && pnpm db:generate`. One command for "I just cloned this."
- `dev:admin` — runs both apps together via `nx run-many -t serve -p <apps> --parallel=2`, so
  contributors don't have to remember to start two terminals.
- `dev:all` — `dev:infra` (Postgres up) then `dev:admin`, for a true one-command cold start.
- `build:admin` — `nx run-many -t build -p <apps>`, what CI/the Dockerfile build stage calls.
- `db:generate` / `db:push` / `db:migrate` / `db:deploy` / `db:seed` / `db:studio` — each explicitly
  passes `--schema=prisma/schema.prisma`. That's not decorative: once there's more than one Prisma
  schema in a monorepo (or the command is run from a different cwd, e.g. inside Docker), Prisma's
  default schema-discovery can silently pick the wrong one.
- `test` — `vitest run` at the workspace root, in addition to whatever per-project Nx test targets
  exist, so a bare `pnpm test` always does something meaningful.
- `lint` — `nx run-many -t lint --all`.
- `format` / `format:check` / `format:ts` / `format:ts:check` — Prettier, split so CI can run the
  cheap check-only variant and a human can run the writing variant.
- `check:templates` — runs `scripts/check-inline-templates.mjs`, which fails the build if any
  Angular `template:` string exceeds 100 characters. Forces `templateUrl` + a sibling `.html` file
  for anything non-trivial, which keeps components readable and diffable.
- `check` — `format:check && check:templates && test`. The one command CI (or a pre-push habit)
  should run.
- `dev:infra` / `dev:infra:down` — bring the dev Postgres container up/down in isolation, for when
  you don't want the apps running too.

## Why conventions live in `.agents/skills/` + `.claude/skills/` instead of one CLAUDE.md

Proto.ai splits agent-facing instructions into two kinds, both indexed from `AGENTS.md` at the
repo root:

- **`.agents/skills/`** — project-specific conventions that only make sense in *this* repo (Nx
  project layout rules, a debugging checklist for this stack's specific failure modes). Written
  once, owned by the repo.
- **`.claude/skills/`** — vendored, third-party library skills (Angular, Taiga UI) fetched with
  `npx skills` and tracked in a `skills-lock.json` so they can be refreshed later
  (`npx skills update`) instead of going stale in someone's memory of the API. Taiga UI ships no
  official skill, so Proto.ai hand-maintains one from Taiga UI's own `llms-full.txt` docs page —
  update that by hand when Taiga UI does a major version bump.

**Why this split matters for a new project:** don't copy Proto.ai's `.agents/skills/` content into
a new repo — those debugging notes and conventions are specific to Proto.ai's own history and
domain. Start the new repo's `.agents/skills/` empty and let it earn its own conventions doc as
real friction shows up. Do carry over the *pattern* (index from `AGENTS.md`, vendor library skills
via `npx skills` rather than pasting docs into the repo by hand).

## Taiga UI tables

If Taiga UI is in the stack, `@taiga-ui/addon-table` is the mandated component for **every** data
table — not native `<table>`, not a different grid library. Proto.ai migrated off AG Grid
specifically to standardize on this, so don't reintroduce a second table library "just for this one
case" in the new project either, unless there's a concrete capability gap.
