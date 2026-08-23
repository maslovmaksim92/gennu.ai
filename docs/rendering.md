# Rendering

The render engine turns a stored `Site` into HTML. It lives in
`libs/engine/render` and has no dependencies — not Angular, not NestJS, not
Tailwind and not Taiga UI. Anything that can read the database can render a
site, which is what keeps cross-framework renderers possible later.

## Why a declarative layout instead of HTML

A block could have stored an HTML template with placeholders. It does not,
because both inputs are untrusted: a block layout is JSON edited in the admin,
and block data comes from a language model. String templating would make every
block a potential injection point, and the markup would only ever be usable by
something that renders HTML strings.

Instead a block stores a tree of nodes. The engine walks the tree and emits
markup itself, so:

- tags come from an allowlist (`ALLOWED_TAGS`);
- attributes come from an allowlist, and every `on*` attribute is rejected;
- `href`/`src` values must pass `sanitizeUrl`, which rules out `javascript:`,
  `data:` and schemes hidden behind control characters;
- all text is escaped;
- CSS that would close `<style>`, import remote sheets or use `expression()` is
  dropped.

Nothing in a block or in generated data can execute.

## Theme contract

Stored in `ThemeVersion.schema`:

```json
{
  "tokens": {
    "color": { "ink": "#151820", "accent": "#2563eb" },
    "space": { "lg": "32px" }
  },
  "css": "optional global css"
}
```

Every token becomes a CSS custom property named `--<group>-<name>`, so
`tokens.color.ink` is available as `var(--color-ink)`.

## Block contract

Stored in `BlockVersion.schema`:

```json
{
  "fields": [{ "key": "title", "type": "text", "required": true }],
  "layout": {
    "tag": "section",
    "style": { "padding": "{space.lg}", "background": "{color.surface}" },
    "children": [
      { "tag": "h1", "text": { "bind": "title" } },
      { "tag": "p", "when": { "bind": "subtitle" }, "text": { "bind": "subtitle" } }
    ]
  },
  "css": "& { text-align: center } h1 { font-size: 44px }"
}
```

`fields` describes the editable inputs. It is used by the admin editors and by
the block catalog handed to the generator; the renderer does not need it.

### Node properties

| Property          | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `tag`             | Element name. Must be in the allowlist.                              |
| `class`           | String or array. Only identifier-like names survive.                 |
| `style`           | Inline declarations. Values may use `{group.name}` token references. |
| `attrs`           | Attributes. URL attributes are sanitised.                            |
| `text`            | Text content, escaped.                                               |
| `children`        | Nested nodes.                                                        |
| `repeat`          | `{ "bind": "items" }` — renders once per array item.                 |
| `as`              | Name the repeated item binds to. Defaults to `item`.                 |
| `when` / `unless` | Renders the node only when the referenced value is truthy / falsy.   |

### Value references

- `"literal string"` — used as-is.
- `{ "const": "value" }` — same, in a position where an object is clearer.
- `{ "bind": "path", "fallback": "..." }` — reads a dot path out of the block
  data. `items.0.label` works; `__proto__`, `constructor` and `prototype` never
  resolve.

Block `defaults` are merged underneath instance data, so an omitted optional
field still renders.

### Block CSS scoping

`css` is prefixed with the block's scope class (`blk-<key>`), so a block cannot
restyle the rest of the page. `&` refers to the block root:

```css
& {
  text-align: center;
} /* .blk-hero { … } */
h1 {
  font-size: 44px;
} /* .blk-hero h1 { … } */
```

## How the engine is packaged

`libs/engine/render` is a pnpm workspace package named `@atlas/render`, so the
name resolves in two ways and both are deliberate:

- through `node_modules` to the package's built `dist/`, which is how
  `admin-api` uses it at runtime;
- through the `tsconfig.base.json` path alias straight to `src/`, which is how
  the Angular admin and the Vitest specs use it while developing.

The package exists because `admin-api` is compiled with plain `tsc`
(`@nx/js:tsc`), and `tsc` does not rewrite path aliases into the emitted
JavaScript. An alias-only import compiles and then throws `MODULE_NOT_FOUND` on
boot. `apps/admin-api/tsconfig.json` therefore resets `paths` to `{}` so that
`admin-api` resolves the name through `node_modules` rather than the alias, and
`admin-api:build` declares `dependsOn` on `render-engine:build` so the `dist/`
it imports always exists first.

`libs/engine/render/dist` is generated and git-ignored. `pnpm build:admin`
builds it as part of the graph; `npx nx build render-engine` builds it alone.

## Versioning

Rendering reads the exact `BlockVersion` each `BlockInstance` pins and the
exact `ThemeVersion` the `Site` pins. Publishing a newer version never changes
an existing site — see [versioning.md](versioning.md). This is the whole reason
the generator stores version IDs rather than copies.

## API

| Endpoint                                    | Auth  | Purpose                                    |
| ------------------------------------------- | ----- | ------------------------------------------ |
| `GET /api/sites`                            | admin | Sites with their pinned template and theme |
| `GET /api/sites/:id`                        | admin | One site with pages and block instances    |
| `GET /api/render/sites/:id/model`           | admin | Structured render model                    |
| `GET /api/render/sites/:id/issues`          | admin | What the engine would refuse to render     |
| `POST /api/render/sites/:id/preview-token`  | admin | Mints a preview link                       |
| `GET /api/render/preview/:token`            | token | The rendered page                          |
| `GET /api/blocks/versions/:id/render-check` | admin | Whether a block version can render         |

### Why preview tokens exist

An iframe cannot attach the admin `Authorization` header, and putting the admin
session token in a URL would leak it into logs and history. The preview route
instead takes a separate JWT with `scope: "site-preview"`, a single `siteId` and
a ten-minute lifetime. The scope claim stops an admin token from being replayed
against the preview route and a preview token from being replayed against the
admin API.

The response sets `Content-Security-Policy: default-src 'none'; …; sandbox` and
`X-Robots-Tag: noindex`, and the admin loads it in an iframe with `sandbox=""`.
The engine emits no scripts; these headers make that a guarantee rather than a
promise.

`GET /api/blocks/versions/:id/render-check` is advisory. It does not block
publishing, so block versions created before the engine existed keep working.

## Trying it

```bash
pnpm db:seed        # administrator
pnpm db:seed:demo   # demo theme, three blocks, one template
pnpm dev:admin
```

Then open Admin → Site Generator, pick the **Demo Landing** template, describe a
site, and the preview panel renders it.

## Tests

```bash
pnpm test
```

The engine's regressions cover escaping, the tag and attribute allowlists, URL
and CSS sanitising, token resolution, `repeat`/`when`/`unless`, defaults and
fallbacks, and prototype-path access. Any change to the contract must come with
a test.
