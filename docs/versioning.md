# Theme and block versioning

Published theme and block versions are immutable artifacts.

## Invariants

- A site pins an exact `ThemeVersion` by `themeVersionId`.
- A block instance pins an exact `BlockVersion` by `blockVersionId`.
- Publishing a newer version never updates an existing site or block instance automatically.
- Published versions cannot be edited. Create a new draft version instead.
- Published versions that are referenced by a site/block instance cannot be deleted; deprecate them instead.
- User-triggered upgrades must create a snapshot/site version before migration, validate the result, show a preview, and only then switch the pinned version.
- Rollback means restoring the previous pinned version/snapshot.

## Version lifecycle

`DRAFT -> PUBLISHED -> DEPRECATED`

A new definition starts with `1.0.0`. Subsequent releases are created as new version records (for example `1.1.0` or `2.0.0`). Even PATCH releases are opt-in for existing users.

## Upgrade flow

1. Detect a newer published version.
2. Show changelog and compatibility information.
3. Create a snapshot of the current page/site state.
4. Run an explicit migration when the schema changed.
5. Validate and render a preview.
6. Switch `themeVersionId`/`blockVersionId` only after user confirmation.
7. Keep the previous snapshot for rollback.
