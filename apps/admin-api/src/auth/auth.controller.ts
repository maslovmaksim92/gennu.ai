import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Ten attempts a minute per address.
   *
   * Enough for someone mistyping a password, far too slow to walk a password
   * list through bcrypt.
   */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: Request & { user: { sub: string; email: string; role: string } }) {
    return { id: req.user.sub, email: req.user.email, role: req.user.role, status: 'ACTIVE' };
  }
}
