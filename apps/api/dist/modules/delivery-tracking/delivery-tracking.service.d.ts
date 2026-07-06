import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import type { RequestUser } from '../../common/types';
import { OrderCacheService } from '../order/order-cache.service';
import { UpdateRiderLocationDto } from '../rider/dto/update-rider-location.dto';
import { DeliveryTrackingCacheService } from './delivery-tracking-cache.service';
import { type TrackingNamespace } from './delivery-tracking.events';
export interface LiveTrackingView {
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    deliveryStatus: string;
    store: {
        lat: number;
        lng: number;
        name: string;
    };
    customer: {
        lat: number;
        lng: number;
        address: Record<string, unknown>;
    };
    rider: {
        id: string;
        name: string;
        lat: number | null;
        lng: number | null;
        heading: number | null;
        speed: number | null;
        lastLocationAt: string | null;
        vehicleType: string | null;
    } | null;
    route: Array<{
        lat: number;
        lng: number;
        recordedAt: string;
    }>;
    eta: {
        estimatedMins: number | null;
        estimatedArrivalAt: string | null;
        etaAvailable: boolean;
        distanceKm: number | null;
        riderDistanceFromStoreKm: number | null;
        riderDistanceToCustomerKm: number | null;
    };
    trackingActive: boolean;
    progressStage: string;
    updatedAt: string;
    provider?: {
        type: string;
        name: string;
        trackingNumber: string | null;
        normalizedStatus: string;
        normalizedStatusLabel?: string;
        badgeLabel?: string;
        driverName?: string | null;
        driverPhone?: string | null;
        vehicleType?: string | null;
    };
    providerTimeline?: Array<{
        status: string;
        label: string;
        description?: string | null;
        occurredAt: string;
    }>;
    hasLiveProviderLocation?: boolean;
}
export declare class DeliveryTrackingService {
    private readonly prisma;
    private readonly events;
    private readonly trackingCache;
    private readonly orderCache;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2, trackingCache: DeliveryTrackingCacheService, orderCache: OrderCacheService);
    processRiderLocation(riderProfileId: string, dto: UpdateRiderLocationDto): Promise<void>;
    private recalculateEta;
    getBuyerTracking(userId: string, orderId: string): Promise<LiveTrackingView>;
    getMerchantTracking(userId: string, orderId: string): Promise<LiveTrackingView>;
    getAdminTracking(orderId: string): Promise<LiveTrackingView>;
    assertSubscribeAccess(user: RequestUser, data: {
        namespace: TrackingNamespace;
        id: string;
        orderId?: string;
    }): Promise<void>;
    getFleetLive(statusFilter?: string): Promise<{
        riders: any;
        stats: {
            onlineRiders: any;
            busyRiders: any;
            offlineRiders: any;
            activeOrders: any;
            unassignedOrders: any;
        };
        updatedAt: string;
    }>;
    getAnalytics(): Promise<{
        avgEtaMins: number;
        avgDeliveryTimeMins: number;
        lateDeliveries: any;
        onlineRiders: any;
        busyRiders: any;
        deliveriesPerRider: any;
    }>;
    emitDeliveryEvent(event: 'STARTED' | 'ARRIVED' | 'COMPLETED', payload: {
        orderId: string;
        orderNumber?: string;
        storeId?: string;
        riderProfileId?: string;
        deliveryStatus?: string;
        orderStatus?: string;
    }): void;
    emitOrderStatus(payload: {
        orderId: string;
        orderNumber: string;
        storeId: string;
        riderProfileId?: string;
        orderStatus: string;
        deliveryStatus?: string;
    }): void;
    private orderTrackingSelect;
    private buildTrackingView;
    private resolveProgressStage;
    pruneTrackingPoints(): Promise<void>;
    summarizeOldRoutes(): Promise<void>;
}
