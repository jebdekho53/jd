"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlOrderStatusNotIn = sqlOrderStatusNotIn;
exports.sqlOrderStatusIn = sqlOrderStatusIn;
const client_1 = require("@prisma/client");
function sqlOrderStatusNotIn(statuses) {
    if (statuses.length === 0)
        return client_1.Prisma.sql `TRUE`;
    return client_1.Prisma.sql `status NOT IN (${client_1.Prisma.join(statuses.map((s) => client_1.Prisma.sql `${s}::"OrderStatus"`))})`;
}
function sqlOrderStatusIn(column, statuses) {
    if (statuses.length === 0)
        return client_1.Prisma.sql `FALSE`;
    return client_1.Prisma.sql `${column} = ANY(ARRAY[${client_1.Prisma.join(statuses.map((s) => client_1.Prisma.sql `${s}::"OrderStatus"`))}]::"OrderStatus"[])`;
}
//# sourceMappingURL=order-status-sql.util.js.map