import { RequestUser } from '../../common/types';
import { FoodPaymentService } from './food-payment.service';
import { VerifyFoodPaymentDto } from './dto/verify-food-payment.dto';
export declare class FoodPaymentController {
    private readonly payment;
    constructor(payment: FoodPaymentService);
    createOrder(user: RequestUser, checkoutId: string, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    verify(user: RequestUser, dto: VerifyFoodPaymentDto, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: any;
            orderNumber: any;
            message: string;
        } | {
            success: boolean;
            orderId: any;
            orderNumber: any;
            message?: undefined;
        };
    }>;
    sync(user: RequestUser, checkoutId: string, forwardedFor?: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: any;
            orderNumber: any;
            message: string;
        } | {
            success: boolean;
            orderId: any;
            orderNumber: any;
            message?: undefined;
        };
    }>;
}
