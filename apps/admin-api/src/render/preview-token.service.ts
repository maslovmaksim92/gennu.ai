import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Seconds a preview link stays valid. Short, because the link carries its own authority. */
export const PREVIEW_TTL_SECONDS = 600;

interface PreviewClaims {
  readonly scope: 'site-preview';
  readonly siteId: string;
  readonly sub: string;
}

/**
 * Issues and verifies preview tokens.
 *
 * An iframe cannot send an `Authorization` header, so the preview URL carries a
 * signed, short-lived, single-purpose token instead of reusing the admin
 * session token. The `scope` claim keeps an admin token from being replayed
 * here and a preview token from being replayed against the admin API.
 */
@Injectable()
export class PreviewTokenService {
  public constructor(private readonly jwt: JwtService) {}

  public async issue(siteId: string, actorId: string): Promise<string> {
    return this.jwt.signAsync(
      { scope: 'site-preview', siteId, sub: actorId } satisfies PreviewClaims,
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: PREVIEW_TTL_SECONDS },
    );
  }

  public async siteIdFrom(token: string): Promise<string> {
    let claims: PreviewClaims;

    try {
      claims = await this.jwt.verifyAsync<PreviewClaims>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Preview link is invalid or has expired.');
    }

    if (claims.scope !== 'site-preview' || !claims.siteId) {
      throw new UnauthorizedException('Preview link is invalid or has expired.');
    }

    return claims.siteId;
  }
}
