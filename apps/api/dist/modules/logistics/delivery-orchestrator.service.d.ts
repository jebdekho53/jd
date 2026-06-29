import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ShipmentProviderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { OrderCacheService } from '../order/order-cache.service';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { OrderDeliveredHandlerService } from '../order/order-delivered-handler.service';
export declare class DeliveryOrchestratorService {
    private readonly prisma;
    private readonly registry;
    private readonly domainEvents;
    private readonly statusHistory;
    private readonly orderCache;
    private readonly events;
    private readonly orderDelivered;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, registry: LogisticsProviderRegistry, domainEvents: DomainEventsService, statusHistory: OrderStatusHistoryService, orderCache: OrderCacheService, events: EventEmitter2, orderDelivered: OrderDeliveredHandlerService, config: ConfigService);
    dispatchShipment(orderId: string, attempt?: number): Promise<{
        shipmentId: string;
        deliveryId: string;
        trackingNumber: string;
        estimatedEtaMins: number | null;
    }>;
    retryShipment(orderId: string): Promise<{
        shipmentId: string;
        deliveryId: string;
        trackingNumber: string;
        estimatedEtaMins: number | null;
    }>;
    cancelShipment(orderId: string, reason?: string): Promise<void>;
    syncShipmentTracking(orderId: string): Promise<void>;
    applyStatusUpdate(shipmentId: string, providerStatus: string, normalizedStatus: ShipmentProviderStatus, extras?: {
        driverName?: string;
        driverPhone?: string;
        vehicleType?: string;
        estimatedEtaMins?: number;
        estimatedArrivalAt?: Date;
        lat?: number;
        lng?: number;
        rawPayload?: unknown;
        podUrl?: string;
    }): Promise<void>;
    private syncOrderStatus;
    private orderStatusForShipment;
    private ensureProviderRecord;
    private buildShipmentInput;
    private resolvePayerContact;
    getDashboardStats(): Promise<{
        activeProvider: import("@prisma/client").$Enums.DeliveryProviderType;
        todayShipments: number;
        successRate: number;
        failureRate: number;
        averageDeliveryCost: number | null;
        averageEtaMins: number | null;
        webhookFailures: number;
        providerHealth: {
            id: string;
            metadata: Prisma.JsonValue | null;
            providerType: import("@prisma/client").$Enums.DeliveryProviderType;
            latencyMs: number | null;
            providerId: string;
            lastError: string | null;
            isHealthy: boolean;
            lastCheckedAt: Date;
        } | null;
        retryQueue: number;
    }>;
}
