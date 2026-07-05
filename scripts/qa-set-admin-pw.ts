import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) throw new Error('usage: tsx qa-set-admin-pw.ts <email> <password>');
  const hash = await bcrypt.hash(password, 12);
  const u = await prisma.user.update({ where: { email }, data: { passwordHash: hash } });
  console.log('OK bcrypt password set for', u.email);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
