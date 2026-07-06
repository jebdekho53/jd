import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { FoodCheckoutService } from './food-checkout.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { OrderCacheService } from '../order/order-cache.service';
import { VerifyFoodPaymentDto } from './dto/verify-food-payment.dto';
export declare class FoodPaymentService {
    private readonly prisma;
    private readonly razorpay;
    private readonly foodCheckout;
    private readonly audit;
    private readonly domainEvents;
    private readonly statusHistory;
    private readonly emailNotifications;
    private readonly buyerPush;
    private readonly orderCache;
    private readonly logger;
    constructor(prisma: PrismaService, razorpay: RazorpayService, foodCheckout: FoodCheckoutService, audit: AuditService, domainEvents: DomainEventsService, statusHistory: OrderStatusHistoryService, emailNotifications: EmailNotificationService, buyerPush: BuyerPushNotificationService, orderCache: OrderCacheService);
    createRazorpayOrder(userId: string, foodCheckoutId: string, ipAddress?: string): Promise<{
        foodCheckoutId: any;
        orderId: any;
        orderNumber: any;
        razorpayOrderId: any;
        keyId: string;
        amount: number;
        currency: string;
    } | {
        foodCheckoutId: any;
        razorpayOrderId: any;
        keyId: string;
        amount: number;
        currency: string;
        orderId?: undefined;
        orderNumber?: undefined;
    }>;
    verifyPayment(userId: string, dto: VerifyFoodPaymentDto, ipAddress?: string): Promise<{
        success: boolean;
        orderId: any;
        orderNumber: any;
        message: string;
    } | {
        success: boolean;
        orderId: any;
        orderNumber: any;
        message?: undefined;
    }>;
    syncPayment(userId: string, foodCheckoutId: string, ipAddress?: string): Promise<{
        success: boolean;
        orderId: any;
        orderNumber: any;
        message: string;
    } | {
        success: boolean;
        orderId: any;
        orderNumber: any;
        message?: undefined;
    }>;
    finalizeFromWebhook(razorpayOrderId: string, razorpayPaymentId: string): Promise<void>;
    private finalizeFoodPayment;
    private requireOwnedFoodCheckout;
}
