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
    getRiderDeliveries(userId: string): Promise<any>;
    getRiderDeliveryByOrderId(userId: string, orderId: string): Promise<any>;
    acceptDelivery(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    arrivedAtStore(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    pickedUp(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    arrivedAtCustomer(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    markDelivered(userId: string, orderId: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    markFailed(userId: string, orderId: string, reason?: string, ipAddress?: string): Promise<{
        deliveryId: any;
        status: any;
    }>;
    private applyTransition;
    private assertCanAdvance;
    private toDomainEvent;
    requireRiderProfile(userId: string): Promise<any>;
    private requireRiderOwnershipByOrder;
}
