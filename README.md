# Proto.ai — Admin MVP

First implementation slice of Proto.ai. This stage intentionally includes only the administration application and its backend.

## Included

- Angular 22 admin application
- NestJS 11 admin API
- PostgreSQL + Prisma
- Admin authentication with HTTP-only JWT cookie
- Admin invitation and management
- User list and status management
- Theme and Block draft CRUD
- AG Grid tables
- External integration settings with encrypted secrets
- OpenAI-backed admin AI chat
- Inline AI assistants in Theme and Block editors
- Audit log persistence foundation
- Docker Compose for PostgreSQL development
- Production Admin Docker image (Angular static app + NestJS API in one container)

## Deferred

Studio, site publishing, domains, CDN, customer registration, customer billing and cross-framework renderers are intentionally deferred.

## Development

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev:infra
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev:admin
```

Admin UI: http://localhost:4200
Admin API: http://localhost:3001/api

The initial admin is created by `pnpm db:seed` using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Production container

```bash
docker compose -f compose/compose.admin.yml up --build
```

The production image serves the Angular application and NestJS API from the same container on port 3001. PostgreSQL remains a separate container.

## OpenAI

Create an `openai` integration from Admin → Integrations and store an API key in the secret field. The key is encrypted before persistence and is never returned to Angular. The AI chat endpoint uses the configured integration on the server.
