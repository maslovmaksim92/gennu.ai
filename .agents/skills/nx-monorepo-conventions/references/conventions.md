# Proto.ai Nx Monorepo Conventions

## Target structure

```text
apps/
  admin/
  admin-api/
  studio/       # when implemented
  studio-api/   # when implemented
  landing/

libs/
  ui/
    ag-grid/
  contracts/
  theme-engine/
  block-engine/
  integrations/
```

Do not invent future apps unless requested. A reserved README is acceptable.

## Angular and NestJS

Use Angular for Admin, Studio, and Landing. Use NestJS for backend applications. Prefer standalone Angular components and `ApplicationConfig` providers.

## Tailwind CSS

Install Tailwind once at workspace root. Use one shared stylesheet such as `styles/tailwind.css` and one root PostCSS config. Include sources for Admin, Studio, Landing, and shared libs. Do not make portable Theme/Block Engine output depend on Tailwind classes.

## Taiga UI

Install compatible Taiga UI packages at root. Use Taiga UI for reusable application controls. Do not make generated user blocks depend on Taiga UI.

## AG Grid Enterprise

Keep `ag-grid-angular`, `ag-grid-community`, and `ag-grid-enterprise` versions aligned. Register `AllEnterpriseModule` once in `libs/ui/ag-grid` and call the shared setup from Admin/Studio bootstrap. Do not register modules independently inside table components. Do not add AG Charts Enterprise unless charts/sparklines are actually required.

## Prettier

Use one root Prettier config. Mandatory rule: every created or modified `.ts` file must be formatted before completion. For repository-wide TypeScript formatting use:

```bash
pnpm format:ts
pnpm format:ts:check
```

## Angular template rule

Inline `template` is allowed only when normalized content is `<= 100` characters. Anything longer must use a sibling `.component.html` via `templateUrl`. After extraction, format both `.ts` and `.html`.

Run:

```bash
pnpm check:templates
```

## Theme/Block Engine boundary

```text
Angular Admin / Studio
  Tailwind
  Taiga UI
  AG Grid Enterprise

Theme Engine / Block Engine
  Design Tokens
  CSS Variables
  portable schemas
```

Do not leak application UI frameworks into portable rendering contracts.

## Verification

Before completing a repository change:

- confirm dependency compatibility;
- confirm Angular templates >100 chars use `templateUrl`;
- confirm each `templateUrl` exists;
- run Prettier/checks when dependencies are available;
- run affected Nx build/lint/typecheck/runtime checks when available;
- never claim successful execution if it did not run.
