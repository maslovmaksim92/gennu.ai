import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.proto_admin_access;
    if (!token) throw new UnauthorizedException();
    try {
      req.user = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}
