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

## What the admin implements today

Admin -> Themes / Blocks / Templates share one version panel: history, a new
draft seeded from the newest version, draft editing, publish, deprecate, and
"where used". Admin -> Sites -> a site -> **Versions** performs the moves.

Against the flow above:

- Steps 1, 2, 5 and 6 exist. `POST /api/sites/:id/upgrades/blocks/preview`
  reports the instance count, the fields the new version adds and drops, which
  dropped fields actually hold content, and which new required fields would
  start empty. Nothing is applied until an operator asks.
- Step 4 does not exist. `BlockVersion.migration` is stored but never executed —
  an upgrade repins, it does not transform data.
- Steps 3 and 7 do not exist as snapshots. What stands in for them: an upgrade
  writes only `BlockInstance.blockVersionId` and never touches `data`, so a
  field the new version dropped keeps its stored value and reverting is the same
  call with `from` and `to` swapped. That is enough for the moves the admin can
  make today, and it stops being enough once migrations start rewriting `data` —
  a real `SiteSnapshot` has to land before that.
- A template version cannot be repinned onto a site that contains blocks it does
  not allow, and a template version that allows an unknown or deprecated block
  version cannot be published. Those two checks are what keep a pinned site
  reproducible by its own editor.
