import { OrderStatus, Prisma } from '@prisma/client';

/** Cast OrderStatus values for PostgreSQL raw queries (avoids enum <> text errors). */
export function sqlOrderStatusNotIn(statuses: OrderStatus[]): Prisma.Sql {
  if (statuses.length === 0) return Prisma.sql`TRUE`;
  return Prisma.sql`status NOT IN (${Prisma.join(
    statuses.map((s) => Prisma.sql`${s}::"OrderStatus"`),
  )})`;
}

export function sqlOrderStatusIn(column: Prisma.Sql, statuses: OrderStatus[]): Prisma.Sql {
  if (statuses.length === 0) return Prisma.sql`FALSE`;
  return Prisma.sql`${column} = ANY(ARRAY[${Prisma.join(
    statuses.map((s) => Prisma.sql`${s}::"OrderStatus"`),
  )}]::"OrderStatus"[])`;
}
