# Proto.ai Landing

Public marketing website for Proto.ai.

This application is intentionally empty for now. It is reserved for the future product landing site used for SEO, advertising campaigns, product positioning, pricing, examples, documentation entry points, and conversion into registration/Studio.

## Planned stack

- Angular 22
- Tailwind CSS (shared monorepo setup)
- Taiga UI only where useful for interactive controls; marketing sections should remain lightweight
- Nx application in the same monorepo
- SSG/prerender for SEO and fast public pages

## Planned routes

- `/` — home
- `/features`
- `/templates`
- `/pricing`
- `/examples`
- `/docs`
- `/blog`

Do not couple the landing page to Admin or Studio runtime. It should be independently buildable and deployable.
