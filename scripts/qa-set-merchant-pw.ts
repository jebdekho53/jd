import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) throw new Error('usage: tsx qa-set-merchant-pw.ts <email> <password>');
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16 });
  const u = await prisma.user.update({ where: { email }, data: { passwordHash: hash } });
  console.log('OK set password for', u.email, 'status', u.status);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
