/**
 * Minimal platform seed — roles + permissions only.
 * Run on production after migrations: pnpm db:seed:platform
 */
import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: 'cart:read', module: 'cart', description: 'View cart' },
  { name: 'cart:write', module: 'cart', description: 'Modify cart' },
  { name: 'orders:read', module: 'orders', description: 'View own orders' },
  { name: 'orders:create', module: 'orders', description: 'Place orders' },
  { name: 'orders:cancel', module: 'orders', description: 'Cancel own orders' },
  { name: 'profile:read', module: 'profile', description: 'View profile' },
  { name: 'profile:write', module: 'profile', description: 'Update profile' },
];

const BUYER_PERMISSIONS = PERMISSIONS.map((p) => p.name);

async function main() {
  console.log('Seeding platform roles and buyer permissions...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
  }

  for (const roleName of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });
  }

  const buyerRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.BUYER } });
  const permissions = await prisma.permission.findMany({
    where: { name: { in: BUYER_PERMISSIONS } },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: buyerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: buyerRole.id, permissionId: permission.id },
    });
  }

  console.log('Platform seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
