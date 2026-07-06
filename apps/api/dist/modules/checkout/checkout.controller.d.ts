import { RequestUser } from '../../common/types';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
export declare class CheckoutController {
    private readonly checkoutService;
    constructor(checkoutService: CheckoutService);
    initiateCheckout(user: RequestUser, dto: InitiateCheckoutDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: any;
            checkoutId: any;
            orderId: any;
            status: any;
            totalAmount: number;
            expiresAt: any;
        };
    }>;
    initiateCodCheckout(user: RequestUser, dto: InitiateCheckoutDto, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: any;
            orderNumber: any;
            status: any;
        };
    }>;
    getCheckout(user: RequestUser, checkoutId: string): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
            totalAmount: number;
            orderId: any;
            expiresAt: any;
            buyerNote: any;
        };
    }>;
}
