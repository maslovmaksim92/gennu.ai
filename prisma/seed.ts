import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');

  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, passwordHash, emailVerified: true },
    create: { email, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE, emailVerified: true },
  });
  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
