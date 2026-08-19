# Proto.ai Agent Instructions

Project-specific reusable instructions live under `.agents/skills/`.

Before making Nx/Angular/NestJS changes, read and follow:

- `.agents/skills/nx-monorepo-conventions/SKILL.md`
- `.agents/skills/nx-monorepo-conventions/references/conventions.md`

When debugging build, runtime, Nx, TypeScript, Prisma, PostgreSQL, Docker, or local-development errors, also read and follow:

- `.agents/skills/proto-nx-debugging/SKILL.md`
- `.agents/skills/proto-nx-debugging/references/regression-checklist.md`

Key project requirements:

- Angular + NestJS in one Nx monorepo.
- TypeScript 6.
- Tailwind + Taiga UI for Admin/Studio application UI.
- AG Grid Enterprise for data-heavy tables.
- Prettier is mandatory for changed `.ts` files.
- Angular inline templates longer than 100 normalized characters must use `templateUrl`.
- Do not couple the portable Theme/Block Engine to Tailwind, Taiga UI, or AG Grid.
- Do not claim build/runtime success unless the relevant command actually ran successfully.
