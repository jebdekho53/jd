import { RequestUser } from '../../common/types';
import { FoodCheckoutService } from './food-checkout.service';
import { InitiateFoodCheckoutDto } from './dto/initiate-food-checkout.dto';
export declare class FoodCheckoutController {
    private readonly checkout;
    constructor(checkout: FoodCheckoutService);
    initiate(user: RequestUser, dto: InitiateFoodCheckoutDto, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    cod(user: RequestUser, dto: InitiateFoodCheckoutDto, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    status(user: RequestUser, checkoutId: string): Promise<{
        success: boolean;
        data: {
            idempotencyKey: string | null;
            id: string;
            status: string;
            createdAt: Date;
            expiresAt: Date;
            updatedAt: Date;
            storeId: string;
            buyerProfileId: string;
            deliveryAddress: import("@prisma/client/runtime/library").JsonValue;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            deliveryLat: number;
            deliveryLng: number;
            couponId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            packagingFee: import("@prisma/client/runtime/library").Decimal;
            tipAmount: import("@prisma/client/runtime/library").Decimal;
            scheduledDeliveryAt: Date | null;
            specialInstructions: string | null;
            restaurantNote: string | null;
            orderId: string | null;
            razorpayOrderId: string | null;
            cartSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
}
