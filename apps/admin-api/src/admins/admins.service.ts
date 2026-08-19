import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AdminsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}
  list() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  invites() {
    return this.prisma.adminInvite.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async invite(email: string, actorId: string) {
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
  async accept(token: string, password: string) {
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
}
