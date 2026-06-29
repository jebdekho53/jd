"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InventoryAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAlertService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let InventoryAlertService = InventoryAlertService_1 = class InventoryAlertService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InventoryAlertService_1.name);
    }
    async checkAndNotifyLowStock(variantId, actorUserId) {
        const row = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            select: {
                sku: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        store: {
                            select: {
                                id: true,
                                name: true,
                                merchantProfile: {
                                    select: { userId: true, businessName: true },
                                },
                            },
                        },
                    },
                },
                inventory: {
                    select: { availableQty: true, lowStockThreshold: true, status: true },
                },
            },
        });
        if (!row?.inventory)
            return;
        const { availableQty, lowStockThreshold } = row.inventory;
        if (availableQty > lowStockThreshold)
            return;
        const merchantUserId = row.product.store.merchantProfile.userId;
        const title = availableQty <= 0 ? 'Out of stock' : 'Low stock alert';
        const body = availableQty <= 0
            ? `${row.product.name} (${row.sku}) is out of stock at ${row.product.store.name}.`
            : `${row.product.name} (${row.sku}) has only ${availableQty} units left (threshold: ${lowStockThreshold}).`;
        const data = {
            productId: row.product.id,
            variantId,
            storeId: row.product.store.id,
            availableQty,
            threshold: lowStockThreshold,
        };
        await this.createAlert(merchantUserId, title, body, data);
        const admins = await this.prisma.user.findMany({
            where: { roles: { some: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } } } },
            select: { id: true },
            take: 20,
        });
        for (const admin of admins) {
            await this.createAlert(admin.id, `[${row.product.store.merchantProfile.businessName}] ${title}`, body, data);
        }
        this.logger.log({ variantId, availableQty, actorUserId }, 'Low stock alert sent');
    }
    async createAlert(userId, title, body, data) {
        const recent = await this.prisma.notification.findFirst({
            where: {
                userId,
                type: client_1.NotificationType.INVENTORY_ALERT,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                body,
            },
        });
        if (recent)
            return;
        await this.prisma.notification.create({
            data: {
                userId,
                type: client_1.NotificationType.INVENTORY_ALERT,
                title,
                body,
                data: data,
            },
        });
    }
};
exports.InventoryAlertService = InventoryAlertService;
exports.InventoryAlertService = InventoryAlertService = InventoryAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryAlertService);
//# sourceMappingURL=inventory-alert.service.js.map