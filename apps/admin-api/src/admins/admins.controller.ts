import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { AdminsService } from './admins.service';

class InviteDto {
  @IsEmail() email!: string;
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
  public update(
    @Param('id') id: string,
    @Body() body: { email: string; status: 'ACTIVE' | 'BLOCKED' | 'INVITED' },
    @Req() req: any,
  ) {
    return this.service.update(id, body, req.user.sub);
  }

  @UseGuards(JwtGuard, AdminGuard)
  @Delete(':id')
  public remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.sub);
  }

  @Post('accept')
  public accept(@Body() dto: AcceptDto) {
    return this.service.accept(dto.token, dto.password);
  }
}
