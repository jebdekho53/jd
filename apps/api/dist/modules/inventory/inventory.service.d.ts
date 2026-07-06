import { ConflictException } from '@nestjs/common';
import { InventoryStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { InventoryCacheService } from './inventory-cache.service';
import { InventoryAlertService } from './inventory-alert.service';
export type StockLevel = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export declare const BUYER_LOW_STOCK_THRESHOLD = 10;
export declare function buyerStockLevel(availableQty: number): StockLevel;
export declare function inventoryChangedException(message: string): ConflictException;
export declare class InventoryService {
    private readonly prisma;
    private readonly cache;
    private readonly alerts;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, cache: InventoryCacheService, alerts: InventoryAlertService, events: EventEmitter2);
    getAvailableQty(inv: {
        availableQty: number;
        reservedQty: number;
        status: InventoryStatus;
    } | null): number;
    reserveForCheckout(checkoutId: string, items: Array<{
        variantId: string;
        productId: string;
        quantity: number;
    }>, expiresAt: Date): Promise<void>;
    linkReservationsToOrder(checkoutId: string, orderId: string): Promise<void>;
    releaseByCheckout(checkoutId: string, reason: 'EXPIRED' | 'CANCELLED' | 'RELEASED'): Promise<void>;
    releaseByOrder(orderId: string): Promise<void>;
    fulfillOnDelivery(orderId: string): Promise<void>;
    adjustAvailableQty(variantId: string, newAvailableQty: number, lowStockThreshold?: number, actorUserId?: string): Promise<{
        availableQty: number;
        reservedQty: number;
        soldQty: number;
        status: InventoryStatus;
    }>;
    setStatus(variantId: string, status: InventoryStatus): Promise<void>;
    listStoreInventory(params: {
        storeId: string;
        search?: string;
        categoryId?: string;
        lowStock?: boolean;
        outOfStock?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: any;
        page: number;
        limit: number;
    }>;
    listAdminInventory(params: {
        storeId?: string;
        lowStock?: boolean;
        outOfStock?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: any;
        page: number;
        limit: number;
    }>;
    getGlobalAnalytics(): Promise<{
        totalAvailable: number;
        totalReserved: number;
        totalSold: number;
        stockValue: number;
        lowStockCount: any;
        fastMoving: any;
        slowMoving: any;
    }>;
    private afterInventoryChange;
}
