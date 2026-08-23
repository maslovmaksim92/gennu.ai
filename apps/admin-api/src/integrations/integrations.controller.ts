import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { toJson } from '../common/dto';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from './crypto.service';
import { SaveIntegrationDto } from './integrations.dto';

/**
 * Every response shape here is an explicit `select`.
 *
 * `secretEncrypted` must never leave the server — not even encrypted, and not
 * even to an authenticated admin. Returning the whole row from a write is the
 * easy way to leak it into a browser, a proxy log or a screenshot, so no query
 * in this controller returns the model unfiltered.
 */
const PUBLIC_FIELDS = {
  id: true,
  provider: true,
  name: true,
  status: true,
  config: true,
  lastCheckedAt: true,
  lastError: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
      orderBy: { provider: 'asc' },
      select: { ...PUBLIC_FIELDS, secretEncrypted: true },
    });

    return rows.map(({ secretEncrypted, ...integration }) => ({
      ...integration,
      hasSecret: Boolean(secretEncrypted),
    }));
  }

  @Put(':provider')
  public async save(@Param('provider') provider: string, @Body() dto: SaveIntegrationDto) {
    const normalizedProvider = provider.trim().toUpperCase();
    const secret = dto.secret?.trim() ?? '';
    const secretEncrypted = secret ? this.crypto.encrypt(secret) : undefined;
    const existing = await this.prisma.integration.findFirst({
      where: {
        provider: {
          equals: normalizedProvider,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    const data = {
      name: dto.name ?? normalizedProvider,
      status: dto.status ?? 'CONNECTED',
      config: toJson(dto.config ?? {}),
      ...(secretEncrypted ? { secretEncrypted } : {}),
    };

    const saved = existing
      ? await this.prisma.integration.update({
          where: { id: existing.id },
          data,
          select: { ...PUBLIC_FIELDS, secretEncrypted: true },
        })
      : await this.prisma.integration.create({
          data: {
            provider: normalizedProvider,
            ...data,
            secretEncrypted,
          },
          select: { ...PUBLIC_FIELDS, secretEncrypted: true },
        });

    const { secretEncrypted: stored, ...integration } = saved;
    return { ...integration, hasSecret: Boolean(stored) };
  }
}
