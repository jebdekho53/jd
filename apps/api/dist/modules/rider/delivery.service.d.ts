import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderDeliveredHandlerService } from '../order/order-delivered-handler.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
export declare class DeliveryService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly orderDelivered;
    private readonly reservation;
    private readonly statusHistory;
    private readonly tracking;
    private readonly buyerPush;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, orderDelivered: OrderDeliveredHandlerService, reservation: ReservationService, statusHistory: OrderStatusHistoryService, tracking: DeliveryTrackingService, buyerPush: BuyerPushNotificationService);
    getRiderDeliveries(userId: string): Promise<({
        order: {
            store: {
                phone: string | null;
                id: string;
                name: string;
                latitude: number;
                longitude: number;
            };
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            deliveryAddress: Prisma.JsonValue;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            orderNumber: string;
            totalAmount: Prisma.Decimal;
            buyerNote: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeliveryStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedAt: Date | null;
        assignedBy: string | null;
        deliveryLat: number;
        deliveryLng: number;
        orderId: string;
        riderProfileId: string | null;
        fulfillmentStoreId: string | null;
        pickupLat: number;
        pickupLng: number;
        distanceKm: number | null;
        estimatedMins: number | null;
        estimatedArrivalAt: Date | null;
        arrivedAtStoreAt: Date | null;
        pickedUpAt: Date | null;
        arrivedAtCustomerAt: Date | null;
        deliveredAt: Date | null;
        deliveryProofUrl: string | null;
        riderEarning: Prisma.Decimal | null;
    })[]>;
    getRiderDeliveryByOrderId(userId: string, orderId: string): Promise<{
        order: {
            store: {
                phone: string | null;
                id: string;
                name: string;
                latitude: number;
                longitude: number;
            };
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            items: {
                productName: string;
                variantName: string;
                quantity: number;
            }[];
            deliveryAddress: Prisma.JsonValue;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            deliveryLat: number;
            deliveryLng: number;
            orderNumber: string;
            totalAmount: Prisma.Decimal;
            buyerNote: string | null;
        };
        assignments: {
            id: string;
            status: import("@prisma/client").$Enums.AssignmentStatus;
            expiresAt: Date;
            assignedBy: string | null;
            riderProfileId: string;
            deliveryId: string;
            offeredAt: Date;
            respondedAt: Date | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeliveryStatus;
        createdAt: Date;
        updatedAt: Date;
        assignedAt: Date | null;
        assignedBy: string | null;
        deliveryLat: number;
        deliveryLng: number;
        orderId: string;
        riderProfileId: string | null;
        fulfillmentStoreId: string | null;
        pickupLat: number;
        pickupLng: number;
        distanceKm: number | null;
        estimatedMins: number | null;
        estimatedArrivalAt: Date | null;
        arrivedAtStoreAt: Date | null;
        pickedUpAt: Date | null;
        arrivedAtCustomerAt: Date | null;
        deliveredAt: Date | null;
        deliveryProofUrl: string | null;
        riderEarning: Prisma.Decimal | null;
    }>;
    acceptDelivery(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "ACCEPTED";
    }>;
    arrivedAtStore(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "ARRIVED_AT_STORE";
    }>;
    pickedUp(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "PICKED_UP";
    }>;
    arrivedAtCustomer(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "ARRIVED_AT_CUSTOMER";
    }>;
    markDelivered(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "DELIVERED";
    }>;
    markFailed(userId: string, orderId: string, reason?: string, ipAddress?: string): Promise<{
        deliveryId: string;
        status: "FAILED";
    }>;
    private applyTransition;
    private assertCanAdvance;
    private toDomainEvent;
    requireRiderProfile(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.RiderStatus;
        kycStatus: import("@prisma/client").$Enums.KycStatus;
    }>;
    private requireRiderOwnershipByOrder;
}
