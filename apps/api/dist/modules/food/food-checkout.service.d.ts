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
        orderId: any;
        orderNumber: any;
        status: any;
        checkoutId?: undefined;
        totalAmount?: undefined;
        expiresAt?: undefined;
    } | {
        checkoutId: any;
        totalAmount: number;
        expiresAt: any;
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
        orderId: any;
        orderNumber: any;
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
        orderId: any;
        orderNumber: any;
        status: any;
    }>;
    getCheckoutStatus(checkoutId: string, userId: string): Promise<any>;
    private effectiveMinOrder;
    private validateCartAvailability;
}
