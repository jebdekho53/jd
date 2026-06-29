import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderCacheService } from '../order/order-cache.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';
export declare const RESERVATION_TTL_MINUTES = 15;
export interface ReservationItem {
    variantId: string;
    productId: string;
    quantity: number;
}
export declare class ReservationService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly inventory;
    private readonly statusHistory;
    private readonly orderCache;
    private readonly lock;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, inventory: InventoryService, statusHistory: OrderStatusHistoryService, orderCache: OrderCacheService, lock: DistributedLockService);
    reserveInventory(checkoutId: string, items: ReservationItem[], userId: string, ipAddress?: string): Promise<void>;
    linkReservationsToOrder(checkoutId: string, orderId: string): Promise<void>;
    releaseReservations(checkoutId: string, reason: 'EXPIRED' | 'CANCELLED' | 'RELEASED', userId?: string): Promise<void>;
    releaseOrderReservations(orderId: string, userId?: string): Promise<void>;
    consumeReservations(checkoutId: string): Promise<void>;
    fulfillOnDelivery(orderId: string): Promise<void>;
    releaseExpiredReservations(): Promise<void>;
    private releaseExpiredReservationsInner;
    private cancelExpiredPendingOrder;
    private cancelStalePaymentPendingOrders;
}
