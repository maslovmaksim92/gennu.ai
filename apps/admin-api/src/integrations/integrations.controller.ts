import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from './crypto.service';

@Controller('integrations')
@UseGuards(JwtGuard, AdminGuard)
export class IntegrationsController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  @Get()
  public async list() {
    const rows = await this.prisma.integration.findMany({
      orderBy: {
        provider: 'asc',
      },
    });

    return rows.map(({ secretEncrypted, ...integration }) => ({
      ...integration,
      hasSecret: Boolean(secretEncrypted),
    }));
  }

  @Put(':provider')
  async save(
    @Param('provider')
    provider: string,
    @Body()
    body: any,
  ) {
    const secretEncrypted = body.secret ? this.crypto.encrypt(body.secret) : undefined;
    return this.prisma.integration.upsert({
      where: {
        provider: {
          equals: normalizedProvider,
          mode: 'insensitive',
        },
      },
    });

    const data = {
      name: body.name ?? normalizedProvider,
      status: body.status ?? 'CONNECTED',
      config: body.config ?? {},
      ...(secretEncrypted ? { secretEncrypted } : {}),
    };

    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.integration.create({
      data: {
        provider: normalizedProvider,
        ...data,
        secretEncrypted,
      },
    });
  }
}
