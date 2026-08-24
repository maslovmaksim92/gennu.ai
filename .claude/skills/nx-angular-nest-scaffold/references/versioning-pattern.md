# Optional add-on: immutable version-lifecycle pattern

This is **not** part of the base scaffold — only pull it in when the new project's domain has
entities that get authored, published, and later evolved without breaking things that already
reference an older version (e.g. form schemas, workflow definitions, page templates, pricing
plans, API contracts).

## The pattern

- Each versionable entity has a parent record (`Theme`, `Template`, ...) and a `*Version` child
  record (`ThemeVersion`, `TemplateVersion`, ...) with a lifecycle:
  `DRAFT -> PUBLISHED -> DEPRECATED`.
- Anything that *uses* a version stores the exact version id it was built with (e.g. a `Site`
  stores `themeVersionId`, not just `themeId`). Publishing a new version never retroactively
  changes what an existing consumer renders/uses.
- Published versions are immutable — no editing in place. A change starts a new `DRAFT` version.
- A published version referenced by something else can't be deleted, only `DEPRECATED`.
- Upgrading a consumer to a newer version is a deliberate, user-triggered action: detect a newer
  published version exists, show a diff/changelog, snapshot current state, validate, preview, and
  only then repin the version id. Keep the snapshot around for rollback.

**Why:** this is what makes "a thing built from version X still looks/behaves like version X
forever" possible, which matters a lot once multiple consumers are pinned to different versions of
the same shared definition.

## Known gap worth deciding upfront (not copying blindly)

In Proto.ai, upgrading a consumer currently just repins the version id — it does **not** run a data
migration even though a `migration` field exists on the version record for that purpose, and there's
no real point-in-time snapshot for rollback (it works today only because upgrades never touch the
consumer's own stored `data`). If the new project's versions will ever need actual data
transformation on upgrade (not just "point at a different definition"), design the snapshot/rollback
mechanism *before* writing migration logic, not after.
