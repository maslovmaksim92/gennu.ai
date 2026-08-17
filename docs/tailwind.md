# Tailwind CSS in Proto.ai

Proto.ai uses a single Tailwind CSS v4 setup for Angular applications in the Nx monorepo.

## Shared files

- `/.postcssrc.json` - enables `@tailwindcss/postcss`.
- `/styles/tailwind.css` - imports Tailwind, registers source paths and contains shared Proto UI theme tokens.

The source registry already scans:

- `apps/admin/src/**/*.{html,ts}`
- `apps/studio/src/**/*.{html,ts}`
- `libs/**/*.{html,ts}`

## Admin

`apps/admin/project.json` includes the shared stylesheet before the legacy Admin SCSS:

```json
"styles": [
  "styles/tailwind.css",
  "apps/admin/src/styles.scss"
]
```

This lets existing Admin styles continue to work while new UI can be implemented with Tailwind utilities.

## Studio

When `apps/studio` is created, use the same shared stylesheet in its build target:

```json
"styles": [
  "styles/tailwind.css",
  "apps/studio/src/styles.scss"
]
```

Do not create a separate Tailwind configuration for Studio. Admin, Studio and shared Angular libraries must use the same Tailwind entrypoint and shared Proto UI tokens.

## Scope

Tailwind is for the Proto.ai application UI (Admin, Studio and shared application components). It must not become the theme format for generated customer sites. Theme Engine and website blocks remain based on Theme Schema, semantic tokens and CSS custom properties.
