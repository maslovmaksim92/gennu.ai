import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  log(
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: unknown,
  ) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, metadata: metadata as never },
    });
  }
}
