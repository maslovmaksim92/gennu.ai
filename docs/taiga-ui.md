# Taiga UI in Proto.ai

Taiga UI is the shared Angular component library for both application frontends:

- `apps/admin`
- `apps/studio` (future)

Tailwind CSS remains the utility/layout layer. Taiga UI is used for interactive application components such as inputs, selects, dialogs, dropdowns, tooltips, tabs, loaders, notifications and other complex controls.

The website Block/Theme Engine must not depend on Taiga UI. Published user blocks remain framework-independent and use design tokens/CSS variables.

## Versions

The monorepo pins Taiga UI 5.x packages compatible with Angular 22:

- `@taiga-ui/cdk`
- `@taiga-ui/core`
- `@taiga-ui/kit`
- `@taiga-ui/layout`
- `@taiga-ui/icons`
- `@taiga-ui/styles`

`@angular/cdk` is pinned to the same Angular version used by the workspace.

## Admin bootstrap

Admin registers Taiga UI in `app.config.ts`:

```ts
import { provideTaiga } from '@taiga-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideTaiga()],
};
```

The application root is wrapped in `TuiRoot`:

```ts
import { TuiRoot } from '@taiga-ui/core';

@Component({
  imports: [TuiRoot, RouterOutlet],
  template: `
    <tui-root>
      <router-outlet />
    </tui-root>
  `,
})
export class AppComponent {}
```

## Studio bootstrap

When `apps/studio` is created, use the same setup:

1. Add `provideTaiga()` to Studio `app.config.ts`.
2. Wrap its root router outlet in `<tui-root>`.
3. Reuse the workspace dependencies; do not install a second Taiga UI version.
4. Reuse `styles/tailwind.css` for Tailwind.

## Import rule

Taiga UI is tree-shakeable. Import only the standalone components/directives required by a feature.

Example:

```ts
import { TuiButton } from '@taiga-ui/core';

@Component({
  imports: [TuiButton],
  template: `<button tuiButton>Save</button>`,
})
export class SaveButtonComponent {}
```

Do not create a giant `SharedTaigaModule` that imports the whole library.

## UI responsibilities

Use Taiga UI for:

- form controls
- buttons and interactive controls
- dialogs/drawers
- dropdowns
- tooltips/hints
- notifications
- tabs/navigation widgets
- loaders and skeleton states

Use Tailwind CSS for:

- page layout
- grids/flex
- responsive composition
- spacing
- simple presentation utilities

Use AG Grid for data-heavy tables.

Do not use Taiga UI inside generated customer websites or portable block renderers.
