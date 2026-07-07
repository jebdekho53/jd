import { RequestUser } from '../../common/types';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
export declare class CheckoutController {
    private readonly checkoutService;
    constructor(checkoutService: CheckoutService);
    initiateCheckout(user: RequestUser, dto: InitiateCheckoutDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            checkoutId: string;
            orderId: string;
            status: import("@prisma/client").$Enums.CheckoutStatus;
            totalAmount: number;
            expiresAt: Date;
        };
    }>;
    initiateCodCheckout(user: RequestUser, dto: InitiateCheckoutDto, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
    }>;
    getCheckout(user: RequestUser, checkoutId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.CheckoutStatus;
            totalAmount: number;
            orderId: string | null;
            expiresAt: Date;
            buyerNote: string | null;
        };
    }>;
}
