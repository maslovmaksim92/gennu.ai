---
name: nx-monorepo-conventions
description: Apply Proto.ai Nx monorepo conventions for Angular and NestJS work. Use when creating, updating, refactoring, reviewing, or scaffolding Admin, Studio, Landing, API, or shared libraries in this repository, including Tailwind, Taiga UI, Prettier, Angular templates, and shared application structure.
---

# Nx Monorepo Conventions

Follow [references/conventions.md](references/conventions.md) as the authoritative project defaults unless the user explicitly overrides them.

## Workflow

1. Inspect `package.json`, `nx.json`, affected `project.json` files, `tsconfig.base.json`, and relevant Angular/NestJS bootstrap files before editing.
2. Preserve application/library boundaries and reuse root dependencies/shared configuration.
3. Keep Admin/Studio application UI dependencies separate from portable Theme/Block Engine contracts.
4. Use `templateUrl` for Angular templates longer than 100 normalized characters.
5. Format every changed `.ts` file with repository Prettier before completion. Also format changed HTML/SCSS/JSON/Markdown.
6. Run `pnpm check:templates` after Angular component changes.
7. Run the narrowest applicable Nx build/lint/typecheck/runtime check. Never claim success if it was not executed.

## Shared UI stack

- Tailwind: layout, spacing, responsive utilities.
- Taiga UI: Angular controls/forms/dialogs/dropdowns/tabs/notifications.
- Taiga UI tables (`@taiga-ui/addon-table`): all data tables. AG Grid was removed on 2026-08-23.

## Repository writes

Prefer one coherent commit per requested refactor instead of one commit per file.
