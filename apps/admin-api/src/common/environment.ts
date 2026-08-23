/**
 * Checks the environment before the application starts.
 *
 * Every secret here used to be read at the moment it was first needed:
 * `JWT_ACCESS_SECRET` when someone logged in, `INTEGRATION_ENCRYPTION_KEY` when
 * someone saved an integration. A deployment missing them came up reporting
 * itself healthy and failed later, on a user action, with an error that did not
 * name the cause. Failing at boot turns that into a deploy-time error instead.
 */

/** Short enough to brute-force is not a useful signing key. */
const MIN_SECRET_LENGTH = 32;

const HEX_64 = /^[0-9a-f]{64}$/i;

export function assertEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const problems: string[] = [];

  if (!env.DATABASE_URL?.trim()) {
    problems.push('DATABASE_URL is required.');
  }

  const jwtSecret = env.JWT_ACCESS_SECRET?.trim() ?? '';

  if (!jwtSecret) {
    problems.push('JWT_ACCESS_SECRET is required.');
  } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  const encryptionKey = env.INTEGRATION_ENCRYPTION_KEY?.trim() ?? '';

  if (!encryptionKey) {
    problems.push('INTEGRATION_ENCRYPTION_KEY is required.');
  } else if (!HEX_64.test(encryptionKey)) {
    problems.push('INTEGRATION_ENCRYPTION_KEY must be 64 hexadecimal characters.');
  }

  if (env.NODE_ENV === 'production' && !env.ADMIN_WEB_URL?.trim()) {
    /**
     * Without it CORS would silently fall back to the development origin, and
     * the admin would fail to talk to its own API for reasons that look like a
     * frontend bug.
     */
    problems.push('ADMIN_WEB_URL is required in production.');
  }

  if (problems.length) {
    throw new Error(
      `Refusing to start. Fix the environment:\n${problems.map((line) => `  - ${line}`).join('\n')}`,
    );
  }
}
