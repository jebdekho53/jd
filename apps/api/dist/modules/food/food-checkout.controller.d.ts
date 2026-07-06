import { RequestUser } from '../../common/types';
import { FoodCheckoutService } from './food-checkout.service';
import { InitiateFoodCheckoutDto } from './dto/initiate-food-checkout.dto';
export declare class FoodCheckoutController {
    private readonly checkout;
    constructor(checkout: FoodCheckoutService);
    initiate(user: RequestUser, dto: InitiateFoodCheckoutDto, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    cod(user: RequestUser, dto: InitiateFoodCheckoutDto, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    status(user: RequestUser, checkoutId: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
