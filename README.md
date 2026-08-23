# Proto.ai — Admin MVP

First implementation slice of Proto.ai. This stage intentionally includes only the administration application and its backend.

## Included

- Angular 22 admin application
- NestJS 11 admin API
- TypeScript 6
- PostgreSQL + Prisma
- Admin authentication with JWT Bearer tokens
- Admin invitation and management
- User list and status management
- Versioned Themes, Blocks and Templates
- AI Site Generator that creates Site/Page/BlockInstance drafts from pinned template versions
- Portable render engine that turns a generated site into HTML from its pinned versions
- Sandboxed site preview inside Admin
- Taiga UI tables
- Tailwind CSS
- Taiga UI
- External integration settings with encrypted secrets
- OpenAI-backed admin AI chat
- Inline AI assistants in Theme and Block editors
- Audit log persistence foundation
- Docker Compose for PostgreSQL development
- Production Admin Docker image (Angular static app + NestJS API in one container)

## Deferred

Studio, site publishing, domains, CDN, customer registration, customer billing and cross-framework renderers are intentionally deferred.

## Requirements

- Node.js
- Corepack
- pnpm 10.17.1
- Docker with Docker Compose

## Development

Enable Corepack and install dependencies:

```bash
corepack enable
pnpm install
```

Create the local environment file:

```bash
cp .env.example .env
```

The default development database connection is:

```env
DATABASE_URL=postgresql://proto:proto@localhost:5432/proto
```

Start PostgreSQL:

```bash
pnpm dev:infra
```

Generate the Prisma Client:

```bash
pnpm db:generate
```

Push the current Prisma schema to the development database:

```bash
pnpm db:push
```

Seed the initial administrator:

```bash
pnpm db:seed
```

Start Admin and Admin API together with development hot reload:

```bash
pnpm dev:admin
```

Admin UI: http://localhost:4200

Admin API: http://localhost:3001/api

## Admin authentication

`POST /api/auth/login` returns a JWT together with the authenticated administrator. The Angular Admin stores the access token in `sessionStorage` and sends it to protected API endpoints using:

```http
Authorization: Bearer <token>
```

The Admin application does not use authentication cookies. Closing the browser session clears the token from `sessionStorage`; logout also removes it locally.

## Database commands

```bash
# Start local PostgreSQL
pnpm dev:infra

# Stop local PostgreSQL
pnpm dev:infra:down

# Generate Prisma Client
pnpm db:generate

# Synchronize Prisma schema with the local development database
pnpm db:push

# Create and apply a development migration
pnpm db:migrate

# Apply committed migrations in deployment environments
pnpm db:deploy

# Seed development data / initial administrator
pnpm db:seed

# Generate client, push schema, seed administrator and the render demo set
pnpm db:setup

# Seed the demo theme, blocks and template used by the render engine
pnpm db:seed:demo

# Open Prisma Studio
pnpm db:studio
```

`db:generate`, `db:push`, `db:migrate`, and `db:deploy` explicitly use `prisma/schema.prisma`.

Before running database commands, make sure `.env` exists and `DATABASE_URL` points to a running PostgreSQL instance. For the default local setup, run `pnpm dev:infra` first.

The initial administrator is created by `pnpm db:seed`. Configure its credentials in `.env` using the variables expected by `prisma/seed.ts`.

After pulling a revision that changes `prisma/schema.prisma` (including the Template/Site Generator models), run:

```bash
pnpm db:generate
pnpm db:push
```

## Site Generator

Admin → Site Generator creates websites from versioned templates instead of asking AI to emit arbitrary HTML/CSS. A template version pins the exact BlockVersion IDs AI is allowed to select and can also pin a default ThemeVersion.

Generation flow:

```text
TemplateVersion + prompt
        ↓
approved BlockVersion catalog
        ↓
OpenAI Responses API
        ↓
structured site JSON
        ↓
server validation
        ↓
Site → Page → BlockInstance
```

Generated sites persist the concrete `TemplateVersion`, optional `ThemeVersion`, and each `BlockVersion`, so later template/block/theme releases do not silently change existing sites.

## Rendering

Generated sites are rendered by `libs/engine/render`, a dependency-free engine
that walks a declarative node tree instead of interpolating HTML strings. Tags
and attributes are allowlisted, URLs and CSS are sanitised and all text is
escaped, so neither a block layout nor model-generated data can inject markup.

A block stores its markup as a node tree in `BlockVersion.schema.layout`; a
theme stores design tokens in `ThemeVersion.schema.tokens`, which become CSS
custom properties. Rendering always reads the exact versions a site pinned.

Admin -> Site Generator shows a live preview in a sandboxed iframe. The iframe
loads a short-lived, site-scoped preview token rather than the admin session
token, because an iframe cannot send an `Authorization` header.

Seed a theme, three blocks and a template to try it:

```bash
pnpm db:seed:demo
```

The contract is documented in [docs/rendering.md](docs/rendering.md).

## Tests

```bash
pnpm test
```

Regressions for the render engine live next to it in `libs/engine/render`. The
`pnpm check` script runs formatting, the inline-template rule and the tests.

## Formatting

Format the repository:

```bash
pnpm format
```

Format all TypeScript files:

```bash
pnpm format:ts
```

Check formatting and Angular inline-template rules:

```bash
pnpm check
```

Angular inline templates longer than 100 normalized characters must be moved to a sibling `.component.html` file and referenced through `templateUrl`.

## Production container

```bash
docker compose -f compose/compose.admin.yml up --build
```

The production image serves the Angular application and NestJS API from the same container on port 3001. PostgreSQL remains a separate container.

## OpenAI

Create an `openai` integration from Admin → Integrations and store an API key in the secret field. The key is encrypted before persistence and is never returned to Angular. The AI chat and Site Generator use the configured integration on the server.

## Documentation

GitBook-ready documentation is stored under:

```text
docs/gitbook/
├── admin/   # private administrator documentation
└── user/    # end-user documentation
```

Administrator documentation must only be accessible to authenticated users with the `ADMIN` role.
