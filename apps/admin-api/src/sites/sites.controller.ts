import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';

@Controller('sites')
@UseGuards(JwtGuard, AdminGuard)
export class SitesController {
  public constructor(private readonly prisma: PrismaService) {}

  @Get()
  public async list() {
    const sites = await this.prisma.site.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        themeVersion: { include: { theme: true } },
        templateVersion: { include: { template: true } },
        _count: { select: { pages: true } },
      },
    });

    return sites.map((site) => ({
      id: site.id,
      name: site.name,
      pageCount: site._count.pages,
      themeName: site.themeVersion?.theme.name ?? null,
      themeVersion: site.themeVersion?.version ?? null,
      templateName: site.templateVersion?.template.name ?? null,
      templateVersion: site.templateVersion?.version ?? null,
      updatedAt: site.updatedAt,
    }));
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        themeVersion: { include: { theme: true } },
        templateVersion: { include: { template: true } },
        pages: {
          orderBy: { createdAt: 'asc' },
          include: {
            blocks: {
              orderBy: { sortOrder: 'asc' },
              include: { blockVersion: { include: { blockDefinition: true } } },
            },
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    return site;
  }
}
