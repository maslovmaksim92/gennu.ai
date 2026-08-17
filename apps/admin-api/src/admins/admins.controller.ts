import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { AdminsService } from './admins.service';
class InviteDto { @IsEmail() email!:string; }
class AcceptDto { @IsString() token!:string; @IsString() @MinLength(8) password!:string; }
@Controller('admins') export class AdminsController {
  constructor(private service:AdminsService){}
  @UseGuards(JwtGuard,AdminGuard) @Get() list(){return this.service.list();}
  @UseGuards(JwtGuard,AdminGuard) @Get('invites') invites(){return this.service.invites();}
  @UseGuards(JwtGuard,AdminGuard) @Post('invite') invite(@Body() dto:InviteDto,@Req() req:any){return this.service.invite(dto.email,req.user.sub);}
  @Post('accept') accept(@Body() dto:AcceptDto){return this.service.accept(dto.token,dto.password);}
}
