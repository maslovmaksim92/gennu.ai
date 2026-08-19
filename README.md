# Proto.ai — Admin MVP

First implementation slice of Proto.ai. This stage intentionally includes only the administration application and its backend.

## Included

- Angular 22 admin application
- NestJS 11 admin API
- TypeScript 6
- PostgreSQL + Prisma
- Admin authentication with HTTP-only JWT cookie
- Admin invitation and management
- User list and status management
- Versioned Themes and Blocks
- AG Grid Enterprise tables
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
```

`db:generate`, `db:push`, `db:migrate`, and `db:deploy` explicitly use `prisma/schema.prisma`.

Before running database commands, make sure `.env` exists and `DATABASE_URL` points to a running PostgreSQL instance. For the default local setup, run `pnpm dev:infra` first.

The initial administrator is created by `pnpm db:seed`. Configure its credentials in `.env` using the variables expected by `prisma/seed.ts`.

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

Create an `openai` integration from Admin → Integrations and store an API key in the secret field. The key is encrypted before persistence and is never returned to Angular. The AI chat endpoint uses the configured integration on the server.

## Documentation

GitBook-ready documentation is stored under:

```text
docs/gitbook/
├── admin/   # private administrator documentation
└── user/    # end-user documentation
```

Administrator documentation must only be accessible to authenticated users with the `ADMIN` role.
