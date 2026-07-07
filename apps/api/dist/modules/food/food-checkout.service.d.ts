import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FoodCartService } from './food-cart.service';
import { InitiateFoodCheckoutDto } from './dto/initiate-food-checkout.dto';
import { GeospatialService } from '../geospatial/geospatial.service';
import { OrderFinancialsService } from '../finance/order-financials.service';
export declare class FoodCheckoutService {
    private readonly prisma;
    private readonly foodCart;
    private readonly audit;
    private readonly domainEvents;
    private readonly geospatial;
    private readonly orderFinancials;
    private readonly logger;
    constructor(prisma: PrismaService, foodCart: FoodCartService, audit: AuditService, domainEvents: DomainEventsService, geospatial: GeospatialService, orderFinancials: OrderFinancialsService);
    initiateCheckout(userId: string, dto: InitiateFoodCheckoutDto, idempotencyKey?: string): Promise<{
        orderId: string;
        orderNumber: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        checkoutId?: undefined;
        totalAmount?: undefined;
        expiresAt?: undefined;
    } | {
        checkoutId: string;
        totalAmount: number;
        expiresAt: Date;
        orderId?: undefined;
        orderNumber?: undefined;
        status?: undefined;
    }>;
    createPaidOrderFromCheckout(opts: {
        checkoutId: string;
        buyerProfileId: string;
        userId: string;
        razorpayPaymentId: string;
        razorpayOrderId: string | null;
        razorpaySignature?: string;
    }): Promise<{
        orderId: string;
        orderNumber: string;
    }>;
    createFoodOrderFromCart(params: {
        buyerProfileId: string;
        userId: string;
        cart: NonNullable<Awaited<ReturnType<FoodCartService['getFoodCart']>>>;
        dto: InitiateFoodCheckoutDto;
        totalAmount: number;
        tipAmount: number;
        couponDiscount: number;
        idempotencyKey?: string;
    }): Promise<{
        orderId: string;
        orderNumber: string;
        status: import("@prisma/client").$Enums.OrderStatus;
    }>;
    getCheckoutStatus(checkoutId: string, userId: string): Promise<{
        idempotencyKey: string | null;
        id: string;
        status: string;
        createdAt: Date;
        expiresAt: Date;
        updatedAt: Date;
        storeId: string;
        buyerProfileId: string;
        deliveryAddress: Prisma.JsonValue;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        deliveryLat: number;
        deliveryLng: number;
        couponId: string | null;
        subtotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        deliveryFee: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        packagingFee: Prisma.Decimal;
        tipAmount: Prisma.Decimal;
        scheduledDeliveryAt: Date | null;
        specialInstructions: string | null;
        restaurantNote: string | null;
        orderId: string | null;
        razorpayOrderId: string | null;
        cartSnapshot: Prisma.JsonValue | null;
    }>;
    private effectiveMinOrder;
    private validateCartAvailability;
}
