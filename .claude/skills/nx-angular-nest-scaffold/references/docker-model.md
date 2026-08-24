# Docker model: dev = Postgres only, prod = one bundled container

## Dev

`compose/compose.dev.yml` runs **only PostgreSQL**. The Angular app and the NestJS API run
directly on the host (`pnpm dev:admin` → `nx run-many -t serve -p <angular-app> <nest-app>
--parallel=2`), with Nx/webpack/esbuild hot-reload doing its job unhindered by a container
rebuild step.

**Why not containerize the apps in dev too:** rebuilding a Docker image (or even just a bind-mount
container) on every file save is slow and fights the framework's own dev server. Only the stateful
thing (the database) needs to be a container in dev — everything else is faster run natively.

## Prod

A single multi-stage `docker/admin.Dockerfile`:

1. **Build stage** (`node:22-alpine`): installs the full monorepo with `pnpm install`, generates
   the Prisma client, and runs the Nx build for both apps (`pnpm build:admin` /
   `nx run-many -t build -p <angular-app> <nest-app>`). This produces `dist/apps/<angular-app>`
   (static files) and `dist/apps/<nest-app>` (compiled Nest output).
2. **Runtime stage** (`node:22-alpine`): copies over only `node_modules`, `dist`, and `prisma` —
   not the source. Exposes the API's port. `CMD ["node", "dist/apps/<nest-app>/main.js"]`.

The trick that makes "one container, one port" work: the NestJS app's `main.ts` checks
`NODE_ENV === 'production'` and, if so, serves the Angular build's static files itself
(`app.useStaticAssets(...)`) and falls back to `index.html` for any non-`/api` route (Angular's
router then takes over client-side). In dev this branch never runs — Angular's own dev server
handles :4200 and CORS lets it talk to the API on :3001.

`compose/compose.admin.yml` runs that bundled app service plus a separate `postgres` service (with
a healthcheck and `depends_on: condition: service_healthy` so the app doesn't start before the DB
is ready), both driven by env vars rather than hardcoded values.

**Why bundle instead of two containers/two images:** this template targets a small admin-panel-
style deployment where "the whole app" is one deployable unit is simpler to ship and reason about
than a separate static-hosting + API-hosting setup. If the new project expects to scale the
frontend and backend independently (CDN-hosted SPA, autoscaled API), split them into two images
instead — the static-serving trick in `main.ts` is exactly what to remove in that case.

## Files to adapt when scaffolding

- Replace `admin` / `admin-api` with the actual chosen app names everywhere (Dockerfile `COPY`
  paths, compose service names, the `CMD` path, `ADMIN_WEB_URL`/`ADMIN_PORT` env var names if you
  want to rename those too — they're just convention, not framework-required).
- The `OPENAI_MODEL` env var in Proto.ai's compose file is product-specific — drop it unless the
  new project also calls OpenAI from the API.
