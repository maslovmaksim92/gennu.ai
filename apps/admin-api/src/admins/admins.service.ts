import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AdminsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public invites() {
    return this.prisma.adminInvite.findMany({ orderBy: { createdAt: 'desc' } });
  }

  public async invite(email: string, actorId: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists?.role === 'ADMIN') throw new BadRequestException('Already admin');
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invite = await this.prisma.adminInvite.create({
      data: {
        email,
        tokenHash,
        invitedById: actorId,
        expiresAt: new Date(Date.now() + 72 * 3600_000),
      },
    });
    await this.audit.log(actorId, 'ADMIN_INVITE_CREATED', 'AdminInvite', invite.id, { email });
    return { ...invite, inviteToken: token };
  }

  public async accept(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invite = await this.prisma.adminInvite.findUnique({ where: { tokenHash } });
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date())
      throw new NotFoundException('Invite invalid');
    const passwordHash = await hash(password, 12);
    const user = await this.prisma.user.upsert({
      where: { email: invite.email },
      update: { role: 'ADMIN', status: 'ACTIVE', passwordHash, emailVerified: true },
      create: {
        email: invite.email,
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash,
        emailVerified: true,
      },
    });
    await this.prisma.adminInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });
    return { id: user.id, email: user.email };
  }

  public async update(
    id: string,
    data: { email: string; status: 'ACTIVE' | 'BLOCKED' | 'INVITED' },
    actorId: string,
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new NotFoundException('Administrator not found');
    }

    if (id === actorId && data.status !== 'ACTIVE') {
      throw new BadRequestException('You cannot disable your own administrator account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email.trim().toLowerCase(),
        status: data.status,
      },
      select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
    });

    await this.audit.log(actorId, 'ADMIN_UPDATED', 'User', admin.id, {
      previousEmail: admin.email,
      email: updated.email,
      status: updated.status,
    });

    return updated;
  }

  public async remove(id: string, actorId: string): Promise<{ id: string }> {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own administrator account');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        _count: {
          select: {
            createdThemes: true,
            createdBlocks: true,
            invitesSent: true,
            auditEntries: true,
            chatSessions: true,
            sites: true,
          },
        },
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new NotFoundException('Administrator not found');
    }

    const hasRelatedData = Object.values(admin._count).some((count) => count > 0);
    if (hasRelatedData) {
      throw new BadRequestException('Administrator has related data and cannot be deleted');
    }

    await this.audit.log(actorId, 'ADMIN_DELETED', 'User', admin.id, { email: admin.email });
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }
}
