import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { AdminsService } from './admins.service';

class InviteDto {
  @IsEmail() email!: string;
}

class UpdateAdminDto {
  @IsEmail() email!: string;
  @IsIn(['ACTIVE', 'BLOCKED', 'INVITED']) status!: 'ACTIVE' | 'BLOCKED' | 'INVITED';
}

class AcceptDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) password!: string;
}

@Controller('admins')
export class AdminsController {
  public constructor(private readonly service: AdminsService) {}

  @UseGuards(JwtGuard, AdminGuard)
  @Get()
  public list() {
    return this.service.list();
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Get('invites')
  public invites() {
    return this.service.invites();
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Post('invite')
  public invite(@Body() dto: InviteDto, @Req() req: any) {
    return this.service.invite(dto.email, req.user.sub);
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Patch(':id')
  public update(@Param('id') id: string, @Body() body: UpdateAdminDto, @Req() req: any) {
    return this.service.update(id, body, req.user.sub);
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Delete(':id')
  public remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.sub);
  }

  /** Unauthenticated and token-bearing, so it gets the same narrow ceiling as login. */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('accept')
  public accept(@Body() dto: AcceptDto) {
    return this.service.accept(dto.token, dto.password);
  }
}
