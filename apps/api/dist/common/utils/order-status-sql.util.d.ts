import { OrderStatus, Prisma } from '@prisma/client';
export declare function sqlOrderStatusNotIn(statuses: OrderStatus[]): Prisma.Sql;
export declare function sqlOrderStatusIn(column: Prisma.Sql, statuses: OrderStatus[]): Prisma.Sql;
