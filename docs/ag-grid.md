# AG Grid Enterprise

Proto.ai uses AG Grid Enterprise as the standard data-grid implementation for both Admin and Studio.

## Versions

Keep these packages on exactly the same AG Grid version:

```json
{
  "ag-grid-angular": "36.0.2",
  "ag-grid-community": "36.0.2",
  "ag-grid-enterprise": "36.0.2"
}
```

## Shared module registration

Do not register AG Grid modules inside page components.

All grid modules are registered once through:

```ts
import { configureAgGrid } from '@atlas/ui-ag-grid';

configureAgGrid();
```

The shared implementation registers `AllEnterpriseModule`, which includes all Community and Enterprise grid modules. This is intentional for the first versions of Proto.ai so every Admin/Studio table can use the full table feature set without adding page-specific module registrations.

## Admin

`apps/admin/src/main.ts` already calls `configureAgGrid()` before Angular bootstrap.

## Studio

When Studio is created, its `main.ts` must use the same setup:

```ts
import { configureAgGrid } from '@atlas/ui-ag-grid';

configureAgGrid();
bootstrapApplication(AppComponent, appConfig);
```

No separate AG Grid configuration should be created for Studio.

## Enterprise features available

The shared Enterprise bundle enables features such as:

- row grouping and aggregation;
- pivoting;
- tree data;
- master/detail;
- server-side row model;
- advanced filters;
- set and multi filters;
- range and cell selection;
- clipboard operations;
- Excel export;
- column tool panel and filters tool panel;
- status bar;
- context menu;
- row grouping panels and other Enterprise grid features.

Use AG Grid for data-heavy tables. Use Taiga UI for surrounding forms, dialogs, buttons, dropdowns and application UI.

## Licence key

The shared setup reads an optional runtime key from:

```ts
globalThis.__PROTO_AG_GRID_LICENSE_KEY__;
```

or accepts it directly:

```ts
configureAgGrid('YOUR_LICENSE_KEY');
```

AG Grid licence keys are client-side licence strings and are not treated as application secrets. Do not store a real production licence key in the repository.

Without a licence key, Enterprise can be evaluated locally but production shows the AG Grid Enterprise watermark/warnings.

## Integrated Charts and Sparklines

`AllEnterpriseModule` enables all grid/table modules, but AG Grid 36 does not bundle AG Charts. If Proto.ai starts using Integrated Charts or Sparklines, add the compatible `ag-charts-enterprise` package and register:

```ts
AllEnterpriseModule.with(AgChartsEnterpriseModule);
```

Do not add AG Charts merely for normal tables.
