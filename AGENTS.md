# Proto.ai Agent Instructions

Project-specific reusable instructions live under `.agents/skills/`.
Vendored third-party library skills live under `.claude/skills/` and are tracked in
`skills-lock.json` (managed by `npx skills`). Both directories are part of the repository
and apply to every agent working here.

Before making Nx/Angular/NestJS changes, read and follow:

- `.agents/skills/nx-monorepo-conventions/SKILL.md`
- `.agents/skills/nx-monorepo-conventions/references/conventions.md`

When debugging build, runtime, Nx, TypeScript, Prisma, PostgreSQL, Docker, or local-development errors, also read and follow:

- `.agents/skills/proto-nx-debugging/SKILL.md`
- `.agents/skills/proto-nx-debugging/references/regression-checklist.md`

Library skills — read the relevant one before writing code against that library, and
prefer it over recalled APIs:

| Skill                                       | Read it before                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.claude/skills/angular-developer/SKILL.md` | Angular work: components, signals, `resource`/`httpResource`, forms, DI, routing, SSR, ARIA, testing |
| `.claude/skills/angular-new-app/SKILL.md`   | Scaffolding a new Angular application                                                                |
| `.claude/skills/ag-dev/SKILL.md`            | Any AG Grid / AG Charts work — columns, themes, cell rendering, server-side row model                |
| `.claude/skills/ag-update/SKILL.md`         | Upgrading AG Grid across major versions                                                              |
| `.claude/skills/taiga-ui/SKILL.md`          | Any Taiga UI work — components, textfields, dialogs, icons, theming, provider setup                  |

Sources: `angular-developer` and `angular-new-app` come from `angular/angular`; `ag-dev`
and `ag-update` from `ag-grid/skills`; both are refreshed with `npx skills update`.
`taiga-ui` is maintained in this repository (Taiga UI ships no official skill) and is
assembled from `https://taiga-ui.dev/llms-full.txt` — update it by hand when Taiga UI
majors change.

Key project requirements:

- Angular + NestJS in one Nx monorepo.
- TypeScript 6.
- Tailwind + Taiga UI for Admin/Studio application UI.
- AG Grid Enterprise for data-heavy tables.
- Prettier is mandatory for changed `.ts` files.
- Angular inline templates longer than 100 normalized characters must use `templateUrl`.
- Do not couple the portable Theme/Block Engine to Tailwind, Taiga UI, or AG Grid.
- Do not claim build/runtime success unless the relevant command actually ran successfully.
