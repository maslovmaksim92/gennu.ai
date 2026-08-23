# Getting Started

## addons.md

```bash
npm i @taiga-ui/addon-charts    // Components for various charts, graphs and visualizations
npm i @taiga-ui/addon-commerce  // Money-related extension with currencies, credit card inputs and validators
npm i @taiga-ui/addon-mobile    // Components and tools specific to mobile version of the app
npm i @taiga-ui/addon-table     // Interactive table component and related utilities
npm i @taiga-ui/addon-doc       // Taiga UI based library for developing documentation portals for Angular libraries
npm i @taiga-ui/layout          // Layout components
```

---

## angular-json-styles.md

```json
{
  "projects": {
    "my-project": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "@taiga-ui/styles/taiga-ui-theme.less",
              "@taiga-ui/styles/taiga-ui-fonts.less",
              "@taiga-ui/addon-mobile/styles/taiga-ui-mobile.less" // optional
            ]
          }
        }
      }
    }
  }
}
```

---

## app-standalone.md

```ts
import { TuiRoot } from '@taiga-ui/core';
// ..
@Component({
  selector: 'app-root',
  imports: [
    TuiRoot,
    // ...
  ],
  templateUrl: './app.component.html',
})
export class App {}
```

---

## app-template.md

```html
<tui-root>
  <!-- content of your app -->
  <ng-container ngProjectAs="tuiOverContent">
    <!-- Content over app content in the portal layer -->
  </ng-container>
</tui-root>
```

---

## assets.md

```json
{
  "projects": {
    "my-project": {
      "architect": {
        "build": {
          // ...
          "assets": [
            {
              "glob": "**/*",
              "input": "node_modules/@taiga-ui/icons/src",
              "output": "assets/taiga-ui/icons"
            }
          ]
        }
      }
    }
  }
}
```

---

## config.md

```ts
export interface TuiOptions {
  // Omit to use OS theme, this is the default
  readonly mode?: 'dark' | 'light';
  // Scale text with OS font size, enabled by default
  readonly fontScaling: boolean;
  // Global window scrollbars, 'custom' by default
  readonly scrollbars: 'custom' | 'native';
  // Opt-in to experimental features as they are introduced, 'stable' by default
  readonly apis: 'stable' | { all: boolean } | Record<string, boolean>;
}
```

---

## index.md

```html
<!doctype html>
<html lang="en">
  <head>
    ...
  </head>
  <body>
    ...
  </body>
  <script>
    // Or whatever key you provided to TUI_DARK_MODE_KEY
    const theme = localStorage?.getItem('tuiDark');
    if (theme === 'true' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.setAttribute('tuiTheme', 'dark');
    }
  </script>
</html>
```

---

## main-standalone.md

```ts
import { provideTaiga } from '@taiga-ui/core';
// ...
bootstrapApplication(App, {
  providers: [
    provideTaiga(),
    //...
  ],
}).catch(console.error);
```

---

## main.md

```bash
npm i @taiga-ui/{cdk,core,kit,icons}
```

---

## main.server.md

```ts
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { mergeApplicationConfig, type ApplicationRef } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideUniversal } from '@ng-web-apis/universal';
import { appConfig } from './app.config';
const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(), provideUniversal()],
});
export default async (context: BootstrapContext): Promise<ApplicationRef> =>
  bootstrapApplication(App, serverConfig, context);
```

---

## nx-add.md

```bash
npm i taiga-ui
nx g taiga-ui:ng-add
```

---

## nx-assets.md

```json
{
  "targets": {
    "build": {
      "options": {
        // ...
        "assets": [
          {
            "glob": "**/*",
            "input": "node_modules/@taiga-ui/icons/src",
            "output": "assets/taiga-ui/icons"
          }
        ]
      }
    }
  }
}
```

---

## nx-migrate.md

```bash
nx migrate @taiga-ui/cdk
nx migrate --run-migrations=migrations.json
```

---

## ponyfill.md

```bash
npm install css-vars-ponyfill
```

---

## project-json-styles.md

```json
{
  "targets": {
    "build": {
      "options": {
        "styles": [
          "@taiga-ui/styles/taiga-ui-theme.less",
          "@taiga-ui/styles/taiga-ui-fonts.less",
          "@taiga-ui/addon-mobile/styles/taiga-ui-mobile.less" // optional
        ]
      }
    }
  }
}
```

---
