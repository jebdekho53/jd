import { RequestUser } from '../../common/types';
import { FoodPaymentService } from './food-payment.service';
import { VerifyFoodPaymentDto } from './dto/verify-food-payment.dto';
export declare class FoodPaymentController {
    private readonly payment;
    constructor(payment: FoodPaymentService);
    createOrder(user: RequestUser, checkoutId: string, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
            foodCheckoutId: string;
            orderId: string;
            orderNumber: string;
            razorpayOrderId: string | null;
            keyId: string;
            amount: number;
            currency: string;
        } | {
            foodCheckoutId: string;
            razorpayOrderId: string;
            keyId: string;
            amount: number;
            currency: string;
            orderId?: undefined;
            orderNumber?: undefined;
        };
    }>;
    verify(user: RequestUser, dto: VerifyFoodPaymentDto, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message: string;
        } | {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message?: undefined;
        };
    }>;
    sync(user: RequestUser, checkoutId: string, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message: string;
        } | {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message?: undefined;
        };
    }>;
}
