import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    res.cookie('proto_admin_access', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('proto_admin_access', { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: Request & { user: { sub: string; email: string; role: string } }) {
    return { id: req.user.sub, email: req.user.email, role: req.user.role, status: 'ACTIVE' };
  }
}
