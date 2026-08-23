# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# The lockfile is copied and honoured. Without it `pnpm install` resolved
# ranges afresh on every build, so two builds of the same commit could ship
# different transitive dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate && pnpm build:admin

# Drop everything only the build needed — Nx, the Angular CLI, TypeScript,
# vitest — while keeping the generated Prisma client, which lives inside the
# @prisma/client package and is a production dependency.
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/libs ./libs
COPY --from=build --chown=node:node /app/prisma ./prisma

# Nothing here needs root.
USER node

EXPOSE 3001

# The app refuses to start without its secrets, so a container that comes up
# unhealthy is the signal that the environment is incomplete.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.ADMIN_PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/apps/admin-api/main.js"]
