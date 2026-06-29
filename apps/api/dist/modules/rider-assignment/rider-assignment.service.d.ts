import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { RiderAssignmentCacheService } from './rider-assignment-cache.service';
import { type ScoredRider } from './rider-assignment.util';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
export declare const RIDER_ASSIGNMENT_EVENTS: {
    readonly ASSIGNED: "order.assigned";
    readonly REASSIGNED: "order.reassigned";
    readonly UNASSIGNED: "order.unassigned";
    readonly LOCATION_UPDATED: "rider.location.updated";
};
export declare class RiderAssignmentService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly statusHistory;
    private readonly cache;
    private readonly events;
    private readonly buyerPush;
    private readonly logger;
    private readonly autoAcceptSeconds;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, statusHistory: OrderStatusHistoryService, cache: RiderAssignmentCacheService, events: EventEmitter2, buyerPush: BuyerPushNotificationService, config: ConfigService);
    autoAssign(orderId: string): Promise<{
        deliveryId: string;
        riderProfileId: string;
    } | null>;
    assign(orderId: string, riderProfileId: string, assignedBy: string, ipAddress?: string): Promise<{
        deliveryId: string;
        riderProfileId: string;
    }>;
    reassign(orderId: string, riderProfileId: string, assignedBy: string, ipAddress?: string): Promise<{
        deliveryId: string;
        riderProfileId: string;
    }>;
    unassign(orderId: string, actorId: string, ipAddress?: string): Promise<void>;
    findBestRider(orderId: string): Promise<ScoredRider | null>;
    getAvailableRiders(storeId: string): Promise<({
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        inZone: boolean;
        activeDeliveries: number;
        distanceKm: number;
        currentLat: number | null;
        currentLng: number | null;
        lastLocationAt: Date | null;
        updatedAt: Date;
    } | {
        zones: {
            id: string;
            name: string;
        }[];
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        inZone: boolean;
        activeDeliveries: number;
        distanceKm: number;
        currentLat: number | null;
        currentLng: number | null;
        lastLocationAt: Date | null;
        updatedAt: Date;
    })[]>;
    listUnassignedOrders(page?: number, limit?: number): Promise<{
        orders: {
            totalAmount: number;
            merchant: {
                id: string;
                businessName: string;
            };
            zones: {
                id: string;
                name: string;
            }[];
            availableRiderCount: number;
            needsRider: boolean;
            buyerProfile: {
                name: string;
            };
            store: {
                merchantProfile: {
                    id: string;
                    businessName: string;
                };
                id: string;
                name: string;
                slug: string;
                storeZones: {
                    zone: {
                        id: string;
                        name: string;
                    };
                }[];
            };
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            orderNumber: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    listLiveRiders(filters?: {
        status?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string;
        userStatus: import("@prisma/client").$Enums.UserStatus;
        zone: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        kycStatus: import("@prisma/client").$Enums.KycStatus;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        currentDelivery: {
            orderNumber: string;
            status: import("@prisma/client").$Enums.DeliveryStatus;
        } | null;
        lastLocation: {
            lat: number;
            lng: number;
        } | null;
        lastSeen: Date;
        activeDeliveries: number;
    }[]>;
    getMetrics(): Promise<{
        unassignedOrders: number;
        onlineRiders: number;
        busyRiders: number;
        idleRiders: number;
        assignmentSuccessRate: number;
        avgAssignmentTimeMins: number;
        assignmentsToday: number;
    }>;
    processPendingOffers(): Promise<void>;
    rejectOffer(userId: string, orderId: string): Promise<void>;
    assignRider: (orderId: string, riderProfileId: string, assignedBy: string, ipAddress?: string) => Promise<{
        deliveryId: string;
        riderProfileId: string;
    }>;
    reassignRider: (orderId: string, riderProfileId: string, assignedBy: string, ipAddress?: string) => Promise<{
        deliveryId: string;
        riderProfileId: string;
    }>;
    listAvailableRidersForStore: (storeId: string) => Promise<({
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        inZone: boolean;
        activeDeliveries: number;
        distanceKm: number;
        currentLat: number | null;
        currentLng: number | null;
        lastLocationAt: Date | null;
        updatedAt: Date;
    } | {
        zones: {
            id: string;
            name: string;
        }[];
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        inZone: boolean;
        activeDeliveries: number;
        distanceKm: number;
        currentLat: number | null;
        currentLng: number | null;
        lastLocationAt: Date | null;
        updatedAt: Date;
    })[]>;
    countAvailableRidersForStore: (storeId: string) => Promise<number>;
    private autoAcceptOffer;
    private expireOffer;
    private getEligibleRidersForStore;
    private requireAssignableOrder;
    private assertRiderEligible;
    private upsertDelivery;
    private resolveFulfillmentStoreId;
    private createAssignmentRecord;
    private finishAssignment;
    private emitWs;
}
