import { PaymentMethod } from '@prisma/client';
export declare class InitiateFoodCheckoutDto {
    deliveryAddress: Record<string, unknown>;
    deliveryLat: number;
    deliveryLng: number;
    paymentMethod: PaymentMethod;
    tipAmount?: number;
    couponDiscount?: number;
    scheduledDeliveryAt?: string;
    specialInstructions?: string;
    restaurantNote?: string;
}
