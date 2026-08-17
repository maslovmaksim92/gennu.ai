import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from './crypto.service';
@Controller('integrations')
@UseGuards(JwtGuard, AdminGuard)
export class IntegrationsController {
  constructor(private prisma: PrismaService, private crypto: CryptoService) {
  }
  @Get()
  async list() {
    const rows = await this.prisma.integration.findMany({
      orderBy: {
        provider: 'asc'
      }
    });
    return rows.map(({ secretEncrypted, ...x }) => ({
      ...x, hasSecret: Boolean(secretEncrypted)
    }));
  }
  @Put(':provider')
  async save(
  @Param('provider')
  provider: string, 
  @Body()
  body: any) {
    const secretEncrypted = body.secret ? this.crypto.encrypt(body.secret) : undefined;
    return this.prisma.integration.upsert({
      where: {
        provider
      }, update: {
        name: body.name ?? provider, status: body.status ?? 'CONNECTED', config: body.config ?? {}, ...(secretEncrypted ? {
          secretEncrypted
        } : {})
      }, create: {
        provider, name: body.name ?? provider, status: body.status ?? 'CONNECTED', config: body.config ?? {}, secretEncrypted
      }
    });
  }
}
