import { OnModuleInit } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderCacheService } from './order-cache.service';
import { OrderStatusHistoryService } from './order-status-history.service';
import { type MerchantPipelineColumn } from './merchant-pipeline.util';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderRefundService } from '../payment/order-refund.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { ListOrdersDto, ListMerchantOrdersDto, ListAdminOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
export declare class OrderService implements OnModuleInit {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly cache;
    private readonly statusHistory;
    private readonly deliveryDispatch;
    private readonly reservation;
    private readonly orderRefunds;
    private readonly buyerPush;
    private readonly deliveryTracking;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, cache: OrderCacheService, statusHistory: OrderStatusHistoryService, deliveryDispatch: DeliveryDispatchService, reservation: ReservationService, orderRefunds: OrderRefundService, buyerPush: BuyerPushNotificationService, deliveryTracking: DeliveryTrackingService);
    listBuyerOrders(userId: string, dto: ListOrdersDto): Promise<{
        orders: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    onModuleInit(): Promise<void>;
    getBuyerOrder(userId: string, orderId: string): Promise<{
        id: any;
        orderNumber: any;
        status: any;
        paymentMethod: any;
        paymentStatus: any;
        subtotal: number;
        discountAmount: number;
        deliveryFee: number;
        taxAmount: number;
        totalAmount: number;
        deliveryAddress: any;
        buyerNote: any;
        cancelReason: any;
        paidAt: any;
        completedAt: any;
        cancelledAt: any;
        createdAt: any;
        updatedAt: any;
        store: {
            id: any;
            name: any;
            slug: any;
            phone: any;
            merchant: {
                id: any;
                businessName: any;
            } | null;
        } | null;
        buyerProfile: {
            id: any;
            name: any;
            phone: any;
        } | null;
        items: any;
        statusHistory: any;
        timeline: {
            status: string;
            note: string | null;
            changedBy: string | null;
            actorType?: string;
            metadata?: unknown;
            createdAt: Date;
        }[];
        delivery: {
            id: any;
            status: any;
            distanceKm: number | null;
            estimatedMins: number | null;
            estimatedArrivalAt: any;
            etaAvailable: boolean;
            liveTrackingAvailable: boolean;
            waitingForPickup: boolean;
            assignedAt: any;
            arrivedAtStoreAt: any;
            pickedUpAt: any;
            arrivedAtCustomerAt: any;
            deliveredAt: any;
            rider: {
                id: any;
                name: any;
                phone: any;
                vehicleType: any;
                status: any;
                currentLat: any;
                currentLng: any;
                lastLocationAt: any;
            } | null;
            assignmentTimeline: any;
        } | null;
        payment: any;
        canReview: boolean;
        review: {
            id: any;
            rating: any;
            storeExperience: any;
            deliveryExperience: any;
            productQuality: any;
            title: any;
            review: any;
            images: any;
            verifiedPurchase: any;
            merchantReply: any;
            merchantRepliedAt: any;
            createdAt: any;
            updatedAt: any;
        } | null;
    }>;
    private logDeliveryCoordinateWarnings;
    private auditActiveDeliveryCoordinates;
    cancelByBuyer(userId: string, orderId: string, dto: CancelOrderDto, ipAddress?: string): Promise<{
        orderId: string;
        status: any;
    }>;
    listMerchantOrders(userId: string, dto: ListMerchantOrdersDto): Promise<{
        orders: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    markOrderIssue(userId: string, orderId: string, note?: string, ipAddress?: string): Promise<{
        orderId: string;
        flagged: boolean;
    }>;
    listAdminOrders(dto: ListAdminOrdersDto): Promise<{
        orders: any;
        meta: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
        };
    }>;
    getAdminOrder(orderId: string): Promise<{
        id: any;
        orderNumber: any;
        status: any;
        paymentMethod: any;
        paymentStatus: any;
        subtotal: number;
        discountAmount: number;
        deliveryFee: number;
        taxAmount: number;
        totalAmount: number;
        deliveryAddress: any;
        buyerNote: any;
        cancelReason: any;
        paidAt: any;
        completedAt: any;
        cancelledAt: any;
        createdAt: any;
        updatedAt: any;
        store: {
            id: any;
            name: any;
            slug: any;
            phone: any;
            merchant: {
                id: any;
                businessName: any;
            } | null;
        } | null;
        buyerProfile: {
            id: any;
            name: any;
            phone: any;
        } | null;
        items: any;
        statusHistory: any;
        timeline: {
            status: string;
            note: string | null;
            changedBy: string | null;
            actorType?: string;
            metadata?: unknown;
            createdAt: Date;
        }[];
        delivery: {
            id: any;
            status: any;
            distanceKm: number | null;
            estimatedMins: number | null;
            estimatedArrivalAt: any;
            etaAvailable: boolean;
            liveTrackingAvailable: boolean;
            waitingForPickup: boolean;
            assignedAt: any;
            arrivedAtStoreAt: any;
            pickedUpAt: any;
            arrivedAtCustomerAt: any;
            deliveredAt: any;
            rider: {
                id: any;
                name: any;
                phone: any;
                vehicleType: any;
                status: any;
                currentLat: any;
                currentLng: any;
                lastLocationAt: any;
            } | null;
            assignmentTimeline: any;
        } | null;
        payment: any;
        canReview: boolean;
        review: {
            id: any;
            rating: any;
            storeExperience: any;
            deliveryExperience: any;
            productQuality: any;
            title: any;
            review: any;
            images: any;
            verifiedPurchase: any;
            merchantReply: any;
            merchantRepliedAt: any;
            createdAt: any;
            updatedAt: any;
        } | null;
    }>;
    getMerchantOrder(userId: string, orderId: string): Promise<{
        customer: {
            name: any;
            phone: any;
            orderCount: any;
            lifetimeSpend: number;
        };
        operations: {
            pipelineColumn: MerchantPipelineColumn;
            orderAgeMins: number;
            sinceAcceptedMins: number | null;
            sincePackingMins: number | null;
            awaitingRider: boolean;
            riderWaitMins: number;
            prepSla: import("./merchant-pipeline.util").SlaLevel;
            packSla: import("./merchant-pipeline.util").SlaLevel;
            riderWaitSla: import("./merchant-pipeline.util").SlaLevel;
        };
        fulfillmentBatch: {
            isBatched: boolean;
            batchId: any;
            batchStatus: any;
            sequence: any;
            totalOrders: any;
            label: string;
            orders: any;
        } | {
            isBatched: boolean;
            label: string;
            batchId?: undefined;
            batchStatus?: undefined;
            sequence?: undefined;
            totalOrders?: undefined;
            orders?: undefined;
        };
        id: any;
        orderNumber: any;
        status: any;
        paymentMethod: any;
        paymentStatus: any;
        subtotal: number;
        discountAmount: number;
        deliveryFee: number;
        taxAmount: number;
        totalAmount: number;
        deliveryAddress: any;
        buyerNote: any;
        cancelReason: any;
        paidAt: any;
        completedAt: any;
        cancelledAt: any;
        createdAt: any;
        updatedAt: any;
        store: {
            id: any;
            name: any;
            slug: any;
            phone: any;
            merchant: {
                id: any;
                businessName: any;
            } | null;
        } | null;
        buyerProfile: {
            id: any;
            name: any;
            phone: any;
        } | null;
        items: any;
        statusHistory: any;
        timeline: {
            status: string;
            note: string | null;
            changedBy: string | null;
            actorType?: string;
            metadata?: unknown;
            createdAt: Date;
        }[];
        delivery: {
            id: any;
            status: any;
            distanceKm: number | null;
            estimatedMins: number | null;
            estimatedArrivalAt: any;
            etaAvailable: boolean;
            liveTrackingAvailable: boolean;
            waitingForPickup: boolean;
            assignedAt: any;
            arrivedAtStoreAt: any;
            pickedUpAt: any;
            arrivedAtCustomerAt: any;
            deliveredAt: any;
            rider: {
                id: any;
                name: any;
                phone: any;
                vehicleType: any;
                status: any;
                currentLat: any;
                currentLng: any;
                lastLocationAt: any;
            } | null;
            assignmentTimeline: any;
        } | null;
        payment: any;
        canReview: boolean;
        review: {
            id: any;
            rating: any;
            storeExperience: any;
            deliveryExperience: any;
            productQuality: any;
            title: any;
            review: any;
            images: any;
            verifiedPurchase: any;
            merchantReply: any;
            merchantRepliedAt: any;
            createdAt: any;
            updatedAt: any;
        } | null;
    }>;
    advanceMerchantOrder(userId: string, orderId: string, targetStatus: OrderStatus, note?: string, ipAddress?: string): Promise<{
        orderId: string;
        status: OrderStatus;
    }>;
    cancelByMerchant(userId: string, orderId: string, dto: CancelOrderDto, ipAddress?: string): Promise<{
        orderId: string;
        status: any;
    }>;
    private getBuyerStoreStats;
    private requireBuyerProfile;
    private getMerchantStoreIds;
    private requireMerchantOrderOwnership;
    private foodKitchenStatusForOrderStatus;
}
