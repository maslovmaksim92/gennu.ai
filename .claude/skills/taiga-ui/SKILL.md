---
name: taiga-ui
description: Use BEFORE writing or changing any Angular code that touches Taiga UI in this repository — components, textfields, dialogs, forms, icons, theming, dark mode, or provider setup. Grounds code in the Taiga UI v5 API actually installed here (correct import packages, CDK date/time types, OnPush, options providers) instead of recalled or v3/v4 APIs.
---

# Taiga UI (v5) in Proto.ai

Unofficial skill, hand-assembled from the official machine-readable docs
(`https://taiga-ui.dev/llms-full.txt`, fetched 2026-08-22). Taiga UI publishes no
official `SKILL.md`. The `references/` files in this skill are verbatim extracts of
those docs — treat them as the source of truth over memory.

## Versions in this repository

| Package | Version | Notes |
| --- | --- | --- |
| `@taiga-ui/*` | `^5.7.0` | v5 — standalone components/directives only, no NgModules |
| `@angular/core` | `^22.1.0` | standalone + signals |
| `ag-grid-*` | `^36.0.2` | separate concern, see boundary below |

Installed packages: `cdk`, `core`, `kit`, `layout`, `icons`, `styles`, `i18n`,
`event-plugins`, `polymorpheus`, `addon-table`, `addon-mobile`, `experimental`.
Do not add another `@taiga-ui/*` package without checking it against `package.json`.

## Workflow

1. Read `.agents/skills/nx-monorepo-conventions/SKILL.md` first — it owns the repo-wide
   Angular/Nx rules (Prettier, `templateUrl` over 100 chars, library boundaries).
2. Before using any `Tui*` symbol, look it up in
   [references/import-map.md](references/import-map.md) and import it from the package
   listed there. Wrong import package is the number one cause of compile errors.
3. Before returning generated code, run through
   [references/checklist-and-mistakes.md](references/checklist-and-mistakes.md).
4. If the docs in `references/` do not cover what you need, fetch
   `https://taiga-ui.dev/llms-full.txt` — do not guess an API from memory.

## Project setup (already done — do not duplicate)

Global configuration lives in `libs/ui/taiga-ui` (path alias `@atlas/taiga-ui`) and is
exported as `taigaUIProviders`, wired into `apps/admin/src/app/app.config.ts`.
`TuiRoot` is already imported in `apps/admin/src/app/app.component.ts`.

Defaults already set there — respect them instead of overriding per component:

- `provideTaiga()`, `provideAnimations()`, `tuiAssetsPathProvider('/assets/taiga-ui/icons')`
- Russian locale via `TUI_LANGUAGE` / `TUI_RUSSIAN_LANGUAGE`, Russian validation messages
  through `tuiValidationErrorsProvider`
- Sizes: textfield/button/checkbox/radio `'s'`, switch `'m'`; scrollbars `'native'`

Changing a global default means editing `libs/ui/taiga-ui/src/lib/taiga-ui-providers.ts`,
which affects every screen — say so explicitly rather than doing it silently.
Per-screen overrides use the same `tui*OptionsProvider` functions in the component's own
`providers` array.

## Hard rules

- **v5 API only.** Anything `NgModule`-based (`TuiInputModule`, `TuiButtonModule`, …) is
  v3 and does not exist here. In v5, `TuiButton` is a *directive* on a native
  `<button>`/`<a>`, not a wrapper component.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **CDK types, not native ones.** Dates and times are `TuiDay`, `TuiMonth`, `TuiYear`,
  `TuiDayRange`, `TuiTime` from `@taiga-ui/cdk` — never `Date` or a plain number. Output
  events emit those types too, not DOM `Event`.
- **No arrow functions or complex expressions in templates.** Move logic into a getter or
  method on the class.
- **Structural directives must be imported.** `*tuiDropdown`, `*tuiItem` and friends each
  need their directive class in the component's `imports`.
- **Forms:** `FormsModule` for `[(ngModel)]`, `ReactiveFormsModule` for
  `FormControl`/`FormGroup`. Missing them is a silent template failure.
- **Never copy `@demo/emulate/*` imports** from documentation examples — they are
  demo-site internals.

## Boundary with AG Grid

`TuiTable` (`@taiga-ui/addon-table`) is for small, static, presentational tables only.
Every data-heavy table — anything with server-side sorting, filtering, pagination, row
grouping or the tool panel — uses AG Grid Enterprise via `@atlas/ui-ag-grid`
(`AgGridImports`, `configureAgGrid()`). See the `ag-dev` skill for that side. Do not mix
the two in one table.

## Boundary with the Theme/Block Engine

The portable Theme/Block Engine must not depend on Taiga UI (repo rule in `AGENTS.md`).
Taiga UI is application-shell UI for Admin/Studio only.

Where the two meet is theming: Taiga UI is themed through `--tui-*` CSS custom properties
and the `tuiTheme` attribute on `<body>` (`document.body.setAttribute('tuiTheme', 'dark')`)
— the same shape as the engine's ThemeSchema → CSS-variables pipeline. When a generated
theme has to reach the admin chrome, map its resolved tokens onto `--tui-*` variables
rather than introducing a second token system or writing raw CSS overrides against Taiga
internals.

## References

- [references/import-map.md](references/import-map.md) — every exported symbol per
  package. Check here before importing.
- [references/checklist-and-mistakes.md](references/checklist-and-mistakes.md) —
  pre-return checklist and the eight most common Taiga UI errors.
- [references/getting-started.md](references/getting-started.md) — bootstrap, styles,
  assets, dark-mode script, `TuiOptions`, SSR.
- [references/migration-guide.md](references/migration-guide.md) — major-version upgrade
  procedure. This is an Nx repo, so the migration path is `nx migrate @taiga-ui/cdk`
  followed by `nx migrate --run-migrations=migrations.json`, not `ng update`.

Upstream, kept in sync manually: `https://taiga-ui.dev/llms-full.txt`. Taiga UI also ships
an official MCP server (`npx @taiga-ui/mcp@latest --source-url=https://taiga-ui.dev/llms-full.txt`)
if live doc lookups are preferred over these vendored extracts.
