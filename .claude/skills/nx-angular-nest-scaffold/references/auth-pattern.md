# Auth pattern: JWT bearer, sessionStorage, no cookies

`POST /api/auth/login` verifies credentials (bcrypt-compared password hash) and returns a JWT
(`@nestjs/jwt`) plus the authenticated user. The Angular app stores the access token in
`sessionStorage` (not `localStorage`, not a cookie) and attaches it as
`Authorization: Bearer <token>` on protected requests via an HTTP interceptor.

**Why sessionStorage instead of a cookie:**

- No CSRF surface to defend — a bearer token in a header isn't sent automatically by the browser
  the way a cookie is, so there's nothing for a forged cross-site request to ride along on.
- Closing the browser tab/window clears the token, which matches an admin-panel threat model
  (shared/kiosk machines, short-lived sessions) better than a persistent cookie would.
- Logout is just clearing the stored value client-side plus (optionally) a server-side
  revocation/blocklist if you need hard invalidation before expiry.

**Why not localStorage:** same XSS exposure as sessionStorage, but persists across tabs/restarts,
which is usually *not* what you want for an admin session — pick sessionStorage unless the product
explicitly needs "stay logged in across browser restarts."

**Trade-off to flag to the user:** a token in `sessionStorage` is readable by any JS running on the
page, so it's exactly as vulnerable to XSS as a non-`httpOnly` cookie would be. This pattern leans
on the app's own XSS hygiene (Angular's default sanitization, no unsanitized `innerHTML`) rather
than an `httpOnly` cookie's browser-enforced isolation. If the new project needs a stronger guarantee
than that, an `httpOnly` refresh-cookie + short-lived in-memory access token is the usual upgrade —
worth a deliberate call, not a default.

## Shape

- NestJS: a `JwtStrategy`/`AuthGuard` pair (Passport-JWT or a hand-rolled guard reading the
  `Authorization` header), an `AuthModule` exporting the guard, and controllers marking protected
  routes with the guard (`@UseGuards(...)`) rather than checking auth ad hoc per handler.
  Passwords are hashed with `bcryptjs` before storage — never store or log plaintext.
- Angular: a token-storage service wrapping `sessionStorage` (so it's the one place that decides
  storage mechanism), an `HttpInterceptor` that attaches the bearer header, and a route guard that
  redirects to `/login` when there's no token.
